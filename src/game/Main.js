import * as THREE from 'three';
import { KTXLoader } from './KTXLoader.js';

let scene
let camera
let renderer
let cube
let formats

export default class Main {
	constructor() {
		this.start()
	}

	start() {
		// 初始化
		scene = new THREE.Scene()
		scene.background = new THREE.Color( 0x550000 );

		// 微信小游戏：使用 weapp-adapter 提供的 canvas
		// 浏览器：Three.js 自动创建 canvas
		const isWx = typeof wx !== 'undefined';
		if (isWx) {
			// 微信环境：使用全局 canvas，强制 WebGL1
			const w = canvas.width || window.innerWidth;
			const h = canvas.height || window.innerHeight;
			camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
			renderer = new THREE.WebGL1Renderer({ canvas: canvas });
			renderer.setSize(w, h);
		} else {
			// 浏览器环境
			camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
			renderer = new THREE.WebGLRenderer({ antialias: true });
			renderer.setSize(window.innerWidth, window.innerHeight);
			document.body.appendChild(renderer.domElement);
		}

		formats = {
			astc: renderer.extensions.has('WEBGL_compressed_texture_astc'),
			etc1: renderer.extensions.has('WEBGL_compressed_texture_etc1'),
			etc2: renderer.extensions.has('WEBGL_compressed_texture_etc'),
			s3tc: renderer.extensions.has('WEBGL_compressed_texture_s3tc'), 
			pvrtc: renderer.extensions.has('WEBGL_compressed_texture_pvrtc') 
		};
		
		console.log("astc", formats.astc); // 安卓 IOS
		console.log("etc1", formats.etc1); // 安卓
		console.log("etc2", formats.etc2); // 安卓
		console.log("pvrtc", formats.pvrtc); // IOS
		console.log("s3tc", formats.s3tc); // PC

		this.createBox1();
		this.createLine();
		camera.position.x = 1.5;
		camera.position.y = 1.5;
		camera.position.z = 1.5;
		camera.lookAt(new THREE.Vector3(0, 0, 0))
		// 开始循环
		this.loop()
	}
	
	testCompressTex() {
		const texture = new THREE.CompressedTexture();
		const geometry = new THREE.BoxGeometry( 1, 1, 1 );
		let material1 = new THREE.MeshBasicMaterial( {
			map: texture
		} );
		material1.map.colorSpace = THREE.SRGBColorSpace;
		const mesh = new THREE.Mesh( geometry, material1 );
		mesh.position.z = 2;
		scene.add(mesh);
		
		if(formats.s3tc){
			console.log("pc")
			this.loadKtx('images_compress/disturb_BC1.ktx', texture);
		}
		if(formats.etc1){
			console.log("安卓")
			this.loadKtx('images_compress/disturb_ETC1.ktx', texture);
		}
		if(formats.astc){
			console.log("安卓")
			this.loadKtx('images_compress/astc/lensflare_ASTC8x8.ktx', texture);
		}
	}

	loadKtx(res, texture){
		fetch(res)
			.then(response => {
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				return response.arrayBuffer();
			})
			.then(buffer => {
				console.log('Done');
				const loader = new KTXLoader();
				let texDatas = loader.parse(buffer, true);
				console.log(texDatas);

				texture.image.width = texDatas.width;
				texture.image.height = texDatas.height;
				texture.mipmaps = texDatas.mipmaps;
				if ( texDatas.mipmapCount === 1 ) texture.minFilter = THREE.LinearFilter;
				texture.format = texDatas.format;
				texture.needsUpdate = true;
				console.log(texture);
			})
			.catch(err => console.error("Request failed", err));
	}

	createBox2() {
		let texture = new THREE.TextureLoader().load("images/bg.jpg");
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		console.log(texture)

		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshBasicMaterial({ map: texture });
		let cube1 = new THREE.Mesh(geometry, material);
		cube1.translateX(2)
		scene.add(cube1);
	}

	createBox1() {
		let vertexShader = `
            precision mediump float;
            precision mediump int;

            uniform mat4 modelViewMatrix; // optional
            uniform mat4 projectionMatrix; // optional

            attribute vec3 position;
            attribute vec2 uv;

            varying vec2 uv2;

            void main()	{
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                uv2 = uv;
            }
        `;

		let fragmentShader = `
            precision mediump float;
            precision mediump int;
            
            uniform sampler2D map;

            varying vec2 uv2;

            void main()	{
                vec4 diff = texture2D( map, vec2(uv2.x, 1.0-uv2.y) );
                gl_FragColor = diff;

            }
        `;
		
		let file_tc = "";
		if(formats.s3tc) file_tc = "DXT1";
		else if(formats.astc) file_tc = "ASTC";
		else if(formats.pvrtc) file_tc = "PVRTC";
		else if(formats.etc2) file_tc = "ETC2";
		else if(formats.etc1) file_tc = "ETC1";
		if(file_tc != "") file_tc = 'images/'+file_tc + ".ktx";
		else file_tc = 'images/JPG.jpg';
		console.log(file_tc);

		let bg = new THREE.CompressedTexture();

		// 微信环境使用 wx.getFileSystemManager()，浏览器使用 fetch
		if (typeof wx !== 'undefined' && wx.getFileSystemManager) {
			// 微信小游戏环境
			const fs = wx.getFileSystemManager();
			try {
				let textureBinary = fs.readFileSync(file_tc);
				const loader = new KTXLoader();
				let texDatas = loader.parse(textureBinary, false);
				console.log(texDatas);
				bg.image.width = texDatas.width;
				bg.image.height = texDatas.height;
				bg.mipmaps = texDatas.mipmaps;
				if (texDatas.mipmapCount === 1) bg.minFilter = THREE.LinearFilter;
				bg.format = texDatas.format;
				bg.needsUpdate = true;
			} catch(e) {
				console.error(e);
			}
		} else if (file_tc.endsWith('.ktx')) {
			// 浏览器环境 - 加载 KTX 压缩纹理
			fetch(file_tc)
				.then(response => response.arrayBuffer())
				.then(buffer => {
					const loader = new KTXLoader();
					let texDatas = loader.parse(buffer, false);
					console.log(texDatas);
					bg.image.width = texDatas.width;
					bg.image.height = texDatas.height;
					bg.mipmaps = texDatas.mipmaps;
					if (texDatas.mipmapCount === 1) bg.minFilter = THREE.LinearFilter;
					bg.format = texDatas.format;
					bg.needsUpdate = true;
				})
				.catch(err => console.error('Failed to load KTX texture:', err));
		} else {
			// 浏览器环境 - 加载普通图片纹理
			const textureLoader = new THREE.TextureLoader();
			textureLoader.load(file_tc, (texture) => {
				bg.image = texture.image;
				bg.needsUpdate = true;
			});
		}

		const rawMaterial = new THREE.RawShaderMaterial({
			name: 'haha',
			uniforms: {
				map: { value: bg }
			},
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
			side: THREE.DoubleSide,
			transparent: false
		});

		const geometry = new THREE.BoxGeometry(1, 1, 1);
		cube = new THREE.Mesh(geometry, rawMaterial);
		scene.add(cube);
	}

	onLoaded(tex) {
		const loader = new THREE.TextureLoader();
		loader.load(
			'images/a4.png',
			function ( texture ) {
				var canvas = document.createElement('canvas');
				var context = canvas.getContext('2d');
				context.drawImage(texture.image, 0, 0, 512, 512);
				console.log(context.getImageData(0, 160, 5, 5).data);
			},
			undefined,
			function ( err ) {
				console.error( 'An error happened.' );
			}
		);
	}

	createLine() {
		const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
		const points = [];
		points.push(new THREE.Vector3(0, 0, 0));
		points.push(new THREE.Vector3(10, 0, 0));

		points.push(new THREE.Vector3(0, 0, 0));
		points.push(new THREE.Vector3(0, 10, 0));

		points.push(new THREE.Vector3(0, 0, 0));
		points.push(new THREE.Vector3(0, 0, 10));

		const geometry = new THREE.BufferGeometry().setFromPoints(points);
		const line = new THREE.Line(geometry, material);
		scene.add(line)
	}

	update() {
		// ... 数据更新代码块 ...
	}

	render() {
		renderer.render(scene, camera);
	}

	loop() {
		this.update()
		this.render()
		requestAnimationFrame(this.loop.bind(this))
	}
}

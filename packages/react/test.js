import * as $asteroid from '@asteroid-mdx/react';
export const Asteroid_2009QW189 = $asteroid.component(
  {
    framework: 'react',
    module: ['import * as THREE from "https://cdn.pika.dev/three"'],
  },
  async function () {
    // webgl_geometry_hierarchy.html
    // https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_hierarchy.html
    await $run(() => <div id="webgl_geometry_hierarchy" width="100%"></div>);
    let camera, scene, renderer, stats, group;
    let mouseX = 0,
      mouseY = 0;
    const dom = document.getElementById('webgl_geometry_hierarchy');
    const { width, height } = dom.getBoundingClientRect();
    init();
    animate();

    function init() {
      camera = new THREE.PerspectiveCamera(60, width / 400, 1, 10000);
      camera.position.z = 500;
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);
      scene.fog = new THREE.Fog(0xffffff, 1, 10000);
      const geometry = new THREE.BoxBufferGeometry(100, 100, 100);
      const material = new THREE.MeshNormalMaterial();
      group = new THREE.Group();

      for (var i = 0; i < 200; i++) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = Math.random() * 2000 - 1000;
        mesh.position.y = Math.random() * 2000 - 1000;
        mesh.position.z = Math.random() * 2000 - 1000;
        mesh.rotation.x = Math.random() * 2 * Math.PI;
        mesh.rotation.y = Math.random() * 2 * Math.PI;
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix();
        group.add(mesh);
      }

      scene.add(group);
      renderer = new THREE.WebGLRenderer({
        antialias: true,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, 400);
      dom.appendChild(renderer.domElement);
      dom.addEventListener('mousemove', onDocumentMouseMove, false);
    }

    function onDocumentMouseMove(event) {
      mouseX = (event.offsetX - 200) * 10;
      mouseY = (event.offsetY - 200) * 10;
    }

    function animate() {
      requestAnimationFrame(animate);
      render();
    }

    function render() {
      const time = Date.now() * 0.001;
      const rx = Math.sin(time * 0.7) * 0.5;
      const ry = Math.sin(time * 0.3) * 0.5;
      const rz = Math.sin(time * 0.2) * 0.5;
      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);
      group.rotation.x = rx;
      group.rotation.y = ry;
      group.rotation.z = rz;
      renderer.render(scene, camera);
    }
  },
);
const makeShortcode = (name) =>
  function MDXDefaultShortcode(props) {
    console.warn(
      'Component ' +
        name +
        ' was not imported, exported, or provided by MDXProvider as global scope',
    );
    return <div {...props} />;
  };

const layoutProps = {
  Asteroid_2009QW189,
};
const MDXLayout = 'wrapper';
export default function MDXContent({ components, ...props }) {
  return (
    <MDXLayout
      {...layoutProps}
      {...props}
      components={components}
      mdxType="MDXLayout"
    >
      <h1>{`Examples of three.js`}</h1>
      <p>
        <a
          parentName="p"
          {...{
            href: 'https://threejs.org/',
          }}
        >{`https://threejs.org/`}</a>
      </p>
      <p>
        <a
          parentName="p"
          {...{
            href: 'https://github.com/mrdoob/three.js',
          }}
        >{`https://github.com/mrdoob/three.js`}</a>
      </p>
      <blockquote>
        <p parentName="blockquote">
          <strong parentName="p">{`JavaScript 3D library`}</strong>
        </p>
        <p parentName="blockquote">{`The aim of the project is to create an easy to use, lightweight, 3D library with a default WebGL renderer.
The library also provides Canvas 2D, SVG and CSS3D renderers in the examples.`}</p>
      </blockquote>
      <h3>{`webgl_geometry_hierarchy`}</h3>
      <p>
        <a
          parentName="p"
          {...{
            href: 'https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_hierarchy.html',
          }}
        >{`https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_hierarchy.html`}</a>
      </p>
      <pre>
        <code
          parentName="pre"
          {...{
            className: 'language-jsx',
            metastring: 'asteroid=2009QW189',
            asteroid: '2009QW189',
          }}
        >{`// webgl_geometry_hierarchy.html
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_hierarchy.html

await $run(() => <div id="webgl_geometry_hierarchy" width="100%"></div>);

let camera, scene, renderer, stats, group;
let mouseX = 0,
  mouseY = 0;

const dom = document.getElementById("webgl_geometry_hierarchy");
const { width, height } = dom.getBoundingClientRect();
init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(60, width / 400, 1, 10000);
  camera.position.z = 500;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  scene.fog = new THREE.Fog(0xffffff, 1, 10000);

  const geometry = new THREE.BoxBufferGeometry(100, 100, 100);
  const material = new THREE.MeshNormalMaterial();

  group = new THREE.Group();
  for (var i = 0; i < 200; i++) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = Math.random() * 2000 - 1000;
    mesh.position.y = Math.random() * 2000 - 1000;
    mesh.position.z = Math.random() * 2000 - 1000;

    mesh.rotation.x = Math.random() * 2 * Math.PI;
    mesh.rotation.y = Math.random() * 2 * Math.PI;

    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();

    group.add(mesh);
  }
  scene.add(group);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, 400);
  dom.appendChild(renderer.domElement);
  dom.addEventListener("mousemove", onDocumentMouseMove, false);
}

function onDocumentMouseMove(event) {
  mouseX = (event.offsetX - 200) * 10;
  mouseY = (event.offsetY - 200) * 10;
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  const time = Date.now() * 0.001;

  const rx = Math.sin(time * 0.7) * 0.5;
  const ry = Math.sin(time * 0.3) * 0.5;
  const rz = Math.sin(time * 0.2) * 0.5;

  camera.position.x += (mouseX - camera.position.x) * 0.05;
  camera.position.y += (-mouseY - camera.position.y) * 0.05;

  camera.lookAt(scene.position);

  group.rotation.x = rx;
  group.rotation.y = ry;
  group.rotation.z = rz;

  renderer.render(scene, camera);
}
`}</code>
      </pre>
      <div>
        <Asteroid_2009QW189 mdxType="Asteroid_2009QW189" />
      </div>
    </MDXLayout>
  );
}

MDXContent.isMDXComponent = true;

import { useRef, useState, Suspense, useEffect, forwardRef } from "react";
import "./App.css";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useControls } from "leva";
import { TextureLoader } from "three";
import ImageUrl from "/ground.jpg";
import { Environment } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";

function App() {
  const [walking, setWalking] = useState(false);
  const human = useRef();
  const texture = useLoader(TextureLoader, ImageUrl);
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 5, 10); // Adjust the initial position of the camera

  // MOdel

  const Model = forwardRef((props, ref) => {
    const gltf = useLoader(GLTFLoader, "/myModel.glb");

    const [mixer, setMixer] = useState(null);

    useEffect(() => {
      if (gltf) {
        const newMixer = new THREE.AnimationMixer(gltf.scene);
        const action = newMixer.clipAction(
          walking ? gltf.animations[1] : gltf.animations[0]
        );
        action.play();
        setMixer(newMixer);
      }
    }, [gltf]);

    useFrame((state, delta) => {
      mixer?.update(delta);
    });

    return (
      <primitive object={gltf.scene} scale={0.19} ref={ref} dispose={null} />
    );
  });

  // Plane

  const Plane = ({ human }) => {
    return (
      <>
        <Environment files="/background2.hdr" background />
        <mesh
          receiveShadow
          position={[-5, -37, -5]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={({ point }) => {
            const from = {
              x: human.current.position.x,
              z: human.current.position.z,
            };
            const to = {
              x: point.x,
              z: point.z,
            };

            setWalking(true);

            // Calculate rotation towards the point
            const angle = Math.atan2(to.z - from.z, to.x - from.x);
            human.current.rotation.y = 360 - angle;

            // Create the tween for moving
            const moveTween = new TWEEN.Tween(human.current.position)
              .to(to, 3000)
              .easing(TWEEN.Easing.Linear.None)
              .onComplete(() => {
                setWalking(false);
              })
              .onStart(() => {
                setWalking(true);
              });

            moveTween.start();
          }}
        >
          <planeGeometry attach="geometry" args={[1000, 1000]} />
          <meshPhongMaterial map={texture} attach="material" color="darkgray" />
        </mesh>
      </>
    );
  };

  // Scene

  const Scene = () => {
    const directionalLightRef = useRef();
    const { lightColor, lightIntensity } = useControls({
      lightColor: "white",
      lightIntensity: {
        value: 2.5,
        min: 0,
        max: 3,
        step: 0.1,
      },
    });

    useFrame(() => {
      TWEEN.update();
    });

    return (
      <>
        <directionalLight
          position={[4, 4, 4]}
          intensity={lightIntensity}
          ref={directionalLightRef}
          color={lightColor}
          castShadow
        />
        <pointLight />

        <ambientLight intensity={0.1} />

        <Model ref={human} />

        <Suspense fallback={null}>
          <Plane human={human} />
        </Suspense>

        <OrbitControls
          target={new THREE.Vector3(10, 100, 25)}
          enableZoom={true}
          maxDistance={500}
          minDistance={50}
        />
      </>
    );
  };

  return (
    <>
      <Canvas shadows>
        <Scene />
      </Canvas>
    </>
  );
}

export default App;

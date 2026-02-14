import React from 'react'; // 显式添加 React 导入
import { Canvas } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float } from '@react-three/drei';

export const HeroBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 bg-black">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={1.5} />
        <Float speed={2}>
          <Sphere args={[1, 64, 64]} scale={1.5}>
            <MeshDistortMaterial
              color="#0066ff"
              distort={0.5}
              speed={2}
              emissive="#0022ff"
              emissiveIntensity={1}
            />
          </Sphere>
        </Float>
      </Canvas>
    </div>
  );
};
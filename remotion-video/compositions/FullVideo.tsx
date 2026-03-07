import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { ProblemQueue } from "./ProblemQueue";
import { ProblemCutting } from "./ProblemCutting";
import { ProblemMissed } from "./ProblemMissed";
import { SolutionReveal } from "./SolutionReveal";
import { Intro } from "./Intro";
import { Signup } from "./Signup";
import { CreateServices } from "./CreateServices";
import { CreatePosts } from "./CreatePosts";
import { AddStaff } from "./AddStaff";
import { PublicPage } from "./PublicPage";
import { ClientFlow } from "./ClientFlow";
import { StaffFlow } from "./StaffFlow";
import { Outro } from "./Outro";

// 30 fps - toutes les durées en frames
const FPS = 30;

// Durées de chaque scène en secondes
const SCENES = [
  // --- Narration : Le problème ---
  { component: ProblemQueue, duration: 10 },    // 0:00 - 0:10  File interminable
  { component: ProblemCutting, duration: 12 },  // 0:10 - 0:22  Resquilleurs
  { component: ProblemMissed, duration: 12 },   // 0:22 - 0:34  RDV manqué
  { component: SolutionReveal, duration: 15 },  // 0:34 - 0:49  Transition → SmartQueue
  // --- Démo : La solution ---
  { component: Intro, duration: 10 },           // 0:49 - 0:59  Logo animé
  { component: Signup, duration: 20 },          // 0:59 - 1:19  Inscription
  { component: CreateServices, duration: 30 },  // 1:19 - 1:49  Services
  { component: CreatePosts, duration: 35 },     // 1:49 - 2:24  Postes
  { component: AddStaff, duration: 45 },        // 2:24 - 3:09  Personnel
  { component: PublicPage, duration: 20 },      // 3:09 - 3:29  Page publique
  { component: ClientFlow, duration: 30 },      // 3:29 - 3:59  Parcours client
  { component: StaffFlow, duration: 40 },       // 3:59 - 4:39  Parcours employé
  { component: Outro, duration: 25 },           // 4:39 - 5:04  Conclusion
];

// Precompute frame offsets
const SCENE_OFFSETS = SCENES.reduce<{ from: number; durationInFrames: number }[]>(
  (acc, scene, i) => {
    const from = i === 0 ? 0 : acc[i - 1].from + acc[i - 1].durationInFrames;
    acc.push({ from, durationInFrames: scene.duration * FPS });
    return acc;
  },
  []
);

export const FullVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {SCENES.map((scene, index) => {
        const { from, durationInFrames } = SCENE_OFFSETS[index];
        const SceneComponent = scene.component;

        return (
          <Sequence
            key={index}
            from={from}
            durationInFrames={durationInFrames}
          >
            <SceneComponent />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

import React from "react";
import { Composition } from "remotion";
import { ProblemQueue } from "./compositions/ProblemQueue";
import { ProblemCutting } from "./compositions/ProblemCutting";
import { ProblemMissed } from "./compositions/ProblemMissed";
import { SolutionReveal } from "./compositions/SolutionReveal";
import { Intro } from "./compositions/Intro";
import { Signup } from "./compositions/Signup";
import { CreateServices } from "./compositions/CreateServices";
import { CreatePosts } from "./compositions/CreatePosts";
import { AddStaff } from "./compositions/AddStaff";
import { PublicPage } from "./compositions/PublicPage";
import { ClientFlow } from "./compositions/ClientFlow";
import { StaffFlow } from "./compositions/StaffFlow";
import { Outro } from "./compositions/Outro";
import { FullVideo } from "./compositions/FullVideo";

// 30 fps, durées en frames
const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Vidéo complète (10+12+12+15 + 10+20+30+35+45+20+30+40+25 = 304s) */}
      <Composition
        id="SmartQueueDemo"
        component={FullVideo}
        durationInFrames={FPS * 304}
        fps={FPS}
        width={1920}
        height={1080}
      />

      {/* --- Narration : Le problème --- */}
      <Composition
        id="Problem1-Queue"
        component={ProblemQueue}
        durationInFrames={FPS * 10}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Problem2-Cutting"
        component={ProblemCutting}
        durationInFrames={FPS * 12}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Problem3-Missed"
        component={ProblemMissed}
        durationInFrames={FPS * 12}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Problem4-SolutionReveal"
        component={SolutionReveal}
        durationInFrames={FPS * 15}
        fps={FPS}
        width={1920}
        height={1080}
      />

      {/* --- Démo : La solution --- */}
      <Composition
        id="Scene1-Intro"
        component={Intro}
        durationInFrames={FPS * 10}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene2-Signup"
        component={Signup}
        durationInFrames={FPS * 20}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene3-CreateServices"
        component={CreateServices}
        durationInFrames={FPS * 30}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene4-CreatePosts"
        component={CreatePosts}
        durationInFrames={FPS * 35}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene5-AddStaff"
        component={AddStaff}
        durationInFrames={FPS * 45}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene6-PublicPage"
        component={PublicPage}
        durationInFrames={FPS * 20}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene7-ClientFlow"
        component={ClientFlow}
        durationInFrames={FPS * 30}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene8-StaffFlow"
        component={StaffFlow}
        durationInFrames={FPS * 40}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene9-Outro"
        component={Outro}
        durationInFrames={FPS * 25}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};

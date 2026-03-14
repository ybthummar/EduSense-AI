import { useEffect } from "react";
import { Link } from "react-router-dom";
import { renderCanvas } from "../components/ui/canvas";
import { Shapes, ArrowRight, Plus } from "lucide-react";
import { Button } from "../components/ui/shadcn-button";

export function LandingPage() {
  useEffect(() => {
    renderCanvas();
  }, []);

  return (
    <section id="home" className="min-h-screen relative overflow-hidden bg-slate-950">
      <div className="animate-rise-in flex flex-col items-center justify-center px-4 text-center mt-20 md:mt-24">
        <div className="z-10 mb-6 mt-10 sm:justify-center md:mb-4 md:mt-20">
          <div className="relative flex items-center whitespace-nowrap rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1 text-xs leading-6 text-slate-300">
            <Shapes className="h-5 p-1 text-cyan-400" /> Introducing EduSense AI.
            <Link
              to="/login"
              className="hover:text-cyan-300 ml-1 flex items-center font-semibold transition-colors"
            >
              <div className="absolute inset-0 flex" aria-hidden="true" />
              Explore{" "}
              <span aria-hidden="true">
                <ArrowRight className="h-4 w-4 ml-1" />
              </span>
            </Link>
          </div>
        </div>

        <div className="mb-10 mt-4 md:mt-6 z-10">
          <div className="px-2 cursor-default">
            <div className="relative mx-auto h-full max-w-7xl border border-slate-800/50 p-6 [mask-image:radial-gradient(800rem_96rem_at_center,white,transparent)] md:px-12 md:py-20 bg-slate-900/20 backdrop-blur-sm rounded-2xl shadow-2xl">
              <h1 className="flex select-none flex-col px-3 py-2 text-center text-5xl font-semibold leading-none tracking-tight md:flex-col md:text-8xl lg:flex-row lg:text-8xl text-transparent bg-clip-text bg-gradient-to-br from-slate-100 to-slate-500">
                <Plus
                  strokeWidth={4}
                  className="text-cyan-500/50 absolute -left-5 -top-5 h-10 w-10"
                />
                <Plus
                  strokeWidth={4}
                  className="text-cyan-500/50 absolute -bottom-5 -left-5 h-10 w-10"
                />
                <Plus
                  strokeWidth={4}
                  className="text-cyan-500/50 absolute -right-5 -top-5 h-10 w-10"
                />
                <Plus
                  strokeWidth={4}
                  className="text-cyan-500/50 absolute -bottom-5 -right-5 h-10 w-10"
                />
                Your complete platform for Education.
              </h1>
              <div className="flex items-center justify-center gap-2 mt-6">
                <span className="relative flex h-3 w-3 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
                </span>
                <p className="text-sm font-medium text-cyan-400">Available Now</p>
              </div>
            </div>
          </div>

          <h1 className="mt-12 text-2xl md:text-3xl text-slate-200 z-10 relative">
            Welcome to the future of learning! We are{" "}
            <span className="text-cyan-400 font-bold">EduSense AI</span>
          </h1>

          <p className="md:text-md z-10 relative mx-auto mb-12 mt-4 max-w-2xl px-6 text-sm text-slate-400 sm:px-6 md:max-w-4xl md:px-20 lg:text-lg">
            Empowering students and faculty with intelligent insights, real-time analytics, and collaborative features to maximize academic success.
          </p>
          <div className="flex justify-center gap-4 z-10 relative">
            <Link to="/login">
              <Button variant="default" size="lg" className="min-w-[160px]">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <canvas
        className="pointer-events-none absolute inset-0 mx-auto z-0"
        id="canvas"
      ></canvas>
    </section>
  );
}

export default LandingPage;

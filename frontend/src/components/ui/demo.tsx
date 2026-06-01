import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

export function BackgroundGradientAnimationDemo() {
  return (
    <BackgroundGradientAnimation
      gradientBackgroundStart="rgb(219, 39, 119)"
      gradientBackgroundEnd="rgb(131, 24, 67)"
      firstColor="244, 114, 182"
      secondColor="251, 207, 232"
      thirdColor="202, 138, 4"
      fourthColor="236, 72, 153"
      fifthColor="253, 224, 71"
      pointerColor="202, 138, 4"
    >
      <div className="absolute z-50 inset-0 flex items-center justify-center text-white font-bold px-4 pointer-events-none text-3xl text-center md:text-4xl lg:text-7xl">
        <p className="bg-clip-text text-transparent drop-shadow-2xl bg-gradient-to-b from-white/80 to-white/20">
          Love on a Budget
        </p>
      </div>
    </BackgroundGradientAnimation>
  );
}

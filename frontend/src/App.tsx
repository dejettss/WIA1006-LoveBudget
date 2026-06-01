import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import Dashboard from "@/components/Dashboard";

function App() {
  return (
    <div className="relative min-h-screen w-full">
      {/* Animated gradient background (elegant pink + gold), fixed behind content */}
      <div className="fixed inset-0 -z-10">
        <BackgroundGradientAnimation
          interactive={false}
          gradientBackgroundStart="rgb(219, 39, 119)"
          gradientBackgroundEnd="rgb(131, 24, 67)"
          firstColor="244, 114, 182"
          secondColor="251, 207, 232"
          thirdColor="202, 138, 4"
          fourthColor="236, 72, 153"
          fifthColor="253, 224, 71"
          pointerColor="202, 138, 4"
          containerClassName="!h-full !w-full"
        />
      </div>
      <Dashboard />
    </div>
  );
}

export default App;

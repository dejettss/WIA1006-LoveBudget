import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import Dashboard from "@/components/Dashboard";
import TeamPage from "@/pages/TeamPage";
import TeamMenu from "@/components/TeamMenu";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    // Keying by pathname remounts on navigation, replaying a smooth enter
    // transition for each page (reliable, no AnimatePresence exit deadlock).
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
    >
      <Routes location={location}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/team" element={<TeamPage />} />
      </Routes>
    </motion.div>
  );
}

function App() {
  return (
    <BrowserRouter>
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
        <TeamMenu />
        <AnimatedRoutes />
      </div>
    </BrowserRouter>
  );
}

export default App;

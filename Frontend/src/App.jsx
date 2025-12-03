import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import './main.css';
import './theme.css';

import Login from "./pages/auth/Login.jsx";
// import ForgotPassword from "./pages/auth/ForgotPassword.jsx";

// Student
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import StudentReport from "./pages/student/StudentReport.jsx";
import StudentProfile from "./pages/student/StudentProfile.jsx";
import GameSelection from "./pages/student/StudentGames.jsx";
import GameSummary from "./pages/student/GameSummary.jsx";

// Educator
import EducatorDashboard from "./pages/educator/EducatorDashboard.jsx";
import EducatorGames from "./pages/educator/EducatorGames.jsx";
import EducatorProfile from "./pages/educator/EducatorProfile.jsx";

// Game (Harry)
import ScenarioIntro from "./pages/game/harry/ScenarioIntro.jsx";
import ScenarioPlay from "./pages/game/harry/ScenarioPlay.jsx";
import TaskDecision from "./pages/game/harry/TaskDecision.jsx";
import Evaluation from "./pages/game/harry/TaskEvaluation.jsx";

// Game (Sens)
import ProjectIntroduction from "./pages/game/sens/GameIntro.jsx";

// Game builder
import BuilderLayout from "./pages/builder/jerry/Layout.jsx";
import GameConfiguration from "./pages/builder/jerry/game_config.jsx";
import PersonaSelection from "./pages/builder/jerry/personaSelection.jsx";
import QuizConfiguration from "./pages/builder/fideris/QuizConfiguration/QuizConfigForm.jsx";
import AddQuizQuestions from './pages/builder/fideris/QuizCreation/AddQuizQuestions.jsx';
import ScenarioIntroduction from './pages/builder/fideris/ScenarioBuilder/ScenarioIntroduction.jsx';
import ActionTasks from './pages/builder/fideris/TasksBuilder/ActionTasks.jsx';
import ExpectedOutcomes from './pages/builder/fideris/TasksBuilder/ExpectedOutcomes.jsx';

import loginImg from "./assets/Login_logo.png";
import signupImg from "./assets/Login_logo.png";


export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/"  element={<Login mode="login"  illusSrc={loginImg}  />} />
                <Route path="/signup" element={<Login mode="signup" illusSrc={signupImg} />} />
                {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}
                <Route path="/student-dashboard" element={<StudentDashboard />} />
                <Route path="/student-report" element={<StudentReport />} />
                <Route path="/educator-dashboard" element={<EducatorDashboard />} />
                <Route path="/game-selection" element={<GameSelection />} />
                <Route path="/scenario-intro" element={<ScenarioIntro />} />
                {/*<Route path="/persona-selection" element={<PersonaSelection />} />*/}
                <Route path="/scenario-play" element={<ScenarioPlay />} />
                <Route path="/task-decision" element={<TaskDecision />} />
                <Route path="/evaluation" element={<Evaluation />} />
                <Route path="/project-intro/:game_id" element={<ProjectIntroduction />} />
                <Route path="/student-profile" element={<StudentProfile />} />
                <Route path="/educator-games" element={<EducatorGames />} />
                <Route path="/educator-profile" element={<EducatorProfile />} />
                {/* <Route path="/task-evaluation" element={<TaskEvaluation/>} /> */}
                <Route path="/game-summary" element={<GameSummary/>} />

                {/* Game Builder Routes */}
                <Route element={<BuilderLayout />}>
                    <Route path="/game-builder"element={<GameConfiguration/>} />
                    <Route path="/persona-selection"element={<PersonaSelection/>} /> 
                </Route>
                <Route path="/quiz-builder" element={<QuizConfiguration />} />
                 <Route path="/quiz-questions" element={<AddQuizQuestions/>} />
                    <Route path="/scenario-introduction" element={<ScenarioIntroduction/>} />
                    <Route path="/action-tasks" element={<ActionTasks/>} />
                    <Route path="/expected-outcomes" element={<ExpectedOutcomes/>} />
            </Routes>
        </Router>
    );
}

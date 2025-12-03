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

// Educator
import EducatorDashboard from "./pages/educator/EducatorDashboard.jsx";
import EducatorGames from "./pages/educator/EducatorGames.jsx";
import EducatorProfile from "./pages/educator/EducatorProfile.jsx";

// Game (Scenario flow)
import ScenarioIntro from "./pages/game/scenario/ScenarioIntro.jsx";
import ScenarioPlay from "./pages/game/scenario/ScenarioPlay.jsx";
import TaskDecision from "./pages/game/evaluation/TaskDecision.jsx";
import Evaluation from "./pages/game/evaluation/TaskEvaluation.jsx";

// Game (Experience/brief + quiz)
import ProjectIntroduction from "./pages/game/GameIntro.jsx";
import GameSummary from "./pages/game/evaluation/GameSummary.jsx";

// Game builder
import BuilderLayout from "./pages/builder/layout/Layout.jsx";
import GameConfiguration from "./pages/builder/GameConfig.jsx";
import PersonaSelection from "./pages/builder/persona/PersonaSelection.jsx";
import QuizConfiguration from "./pages/builder/quiz/QuizConfig.jsx";
import QuizQuestions from './pages/builder/quiz/QuizQuestions.jsx';
import ScenarioBuilder from './pages/builder/scenario/ScenarioBuilder.jsx';
import ActionTasks from './pages/builder/task/TaskActions.jsx';
import ExpectedOutcomes from './pages/builder/task/TaskOutcomes.jsx';

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
                 <Route path="/quiz-questions" element={<QuizQuestions/>} />
                    <Route path="/scenario-introduction" element={<ScenarioBuilder/>} />
                    <Route path="/action-tasks" element={<ActionTasks/>} />
                    <Route path="/expected-outcomes" element={<ExpectedOutcomes/>} />
            </Routes>
        </Router>
    );
}

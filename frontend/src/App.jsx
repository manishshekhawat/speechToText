import  History  from "./History";
import SpeechToText from "./SpeechToText";
import {BrowserRouter,Route,Routes} from "react-router-dom"

function App() {

  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SpeechToText/>}/>
        <Route path="/history" element={<History/>}/>

      </Routes>
    </BrowserRouter>
    
  );
}

export default App;

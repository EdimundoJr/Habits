import { Habit } from "./components/Habits"


function App() {
  return(
    <div >
    <Habit completed={2} />
    <Habit completed={3} />
    <Habit completed={5} />

    </div>
  )
   
  }


export default App
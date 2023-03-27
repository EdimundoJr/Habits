import dayjs from "dayjs";

export function generateDatesFromYearBeginning(){
  const fistDayOfTheYear = dayjs().startOf('year')
  const today = new Date()
  let compareDate = fistDayOfTheYear

  const dates = []

  while(compareDate.isBefore(today)){
    dates.push(compareDate.toDate())
    compareDate = compareDate.add(1, 'day')
  }
  
  return dates
}
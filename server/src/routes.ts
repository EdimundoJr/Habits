import {z} from "zod"
import { prisma } from "./lib/prisma"
import {FastifyInstance} from 'fastify'
import dayjs from "dayjs"


export async function appRoutes(app: FastifyInstance){
  app.post('/habits', async(request) =>{
   const creaeHabitBody = z.object({
    title: z.string(),
    WeekDays: z.array(
      z.number().min(0).max(6)
    )
   })

   const { title, WeekDays} = creaeHabitBody.parse(request.body)

   const today = dayjs().startOf('day').toDate()

   await prisma.habit.create({
    data: {
      title,
      created_at: today,
      WeekDays: {
        create: WeekDays.map(weekDay =>{
          return{
            week_day: weekDay,
          }
        })
      }
    }
   })
  })

  app.get('/day',async (request) => {
    const getDayParams = z.object({
      date: z.coerce.date()
    })

    const { date } = getDayParams.parse(request.query)

    const parseDate = dayjs(date).startOf('day')
    const weekDay = parseDate.get('day')
    

    const possibleHabbits = await prisma.habit.findMany({
      where:{
        created_at: {
          lte : date,
        },
        WeekDays:{
          some: {
            week_day: weekDay,
          }
        }
      }
    
    })

    const day = await prisma.day.findUnique({
      where: {
        date: parseDate.toDate(),
      },
      include: {
        DayHabits: true,
      }
    })

    const completeHabbits = day?.DayHabits.map(DayHabits =>{
      return DayHabits.habit_id
    })


    return{
      possibleHabbits,
      completeHabbits
    }
  })
 
}

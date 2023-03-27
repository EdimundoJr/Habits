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
  
  app.patch('/habits/:id/toggle',async (request) => {
    
    const toggleHabitParams = z.object({
      id: z.string().uuid(),
    })
    const { id } = toggleHabitParams.parse(request.params)

    const today = dayjs().startOf('day').toDate()

    let day = await prisma.day.findUnique({
      where: {
        date: today,
      }
    })

    if (!day) {
      day = await prisma.day.create({
        data:{
          date: today,
        }
      })
    }

    const dayHabit = await prisma.dayHabit.findUnique({
      where: {
        day_id_habit_id: {
          day_id: day.id,
          habit_id: id,
        }
      }
    })

    if (dayHabit){
      await prisma.dayHabit.delete({
        where: {
          id: dayHabit.id,
        }
      })
    } else {
      await prisma.dayHabit.create({
        data:{
          day_id: day.id,
          habit_id: id,
        }
      })
    }

    
  })

  app.get('/summary', async (request) =>{

    const summary = await prisma.$queryRaw`
      SELECT 
      D.id, 
      D.date,
      (
        SELECT
          cast(count(*) as float)
        FROM day_habits DH
        WHERE DH.day_id = D.id
      ) as completed,
      (
        SELECT 
          cast(count(*) as float)
        FROM habit_week_days HWD
        JOIN habits H
          ON H.id = HWD.habit_id
        WHERE
          HWD.week_day = cast(strftime('%W', D.date/1000.0, 'unixepoch') as int)
          AND H.created_at <= D.date
      )as amount

      FROM days D
    `

    return summary
  })
}

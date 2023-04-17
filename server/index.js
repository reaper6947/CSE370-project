const express = require('express')
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express()
const PORT = 5000

app.use(express.json())
app.use(cors())

async function dbConnect() {
    try {
        const connection = await mysql.createConnection({ host: 'localhost', user: 'root', database: 'routine', password: "root" });
        return connection
    } catch (e) {
        console.log(e)
        throw e

    }
}



// console.log(dbConnect())
async function getData() {
    const query = await db.query("show tables")
    return query[0]
}




app.get('/', async (req, res) => {
    res.send(await getData())

})

app.post('/student/course/select', async (req, res) => {
    try {
        let fullBooked = false
        const { courseName, sectionNumber, facultyInitial, totalSeat, email, name, timing, } = req.body

        const db = await dbConnect()

        let courseObj = await db.query("SELECT * from course WHERE course_code=? AND section_number=?", [courseName, sectionNumber])

        let userObj = await db.query("SELECT * from student WHERE email=?", [email])

        if (userObj[0].length == 0) {
            userObj = await db.query("INSERT INTO student (email,full_name) VALUES (?,?) ", [email, name])
            userObj['email'] = email

        } else {
            userObj['email'] = userObj[0][0]['email']
        }
        if (courseObj[0].length == 0) {
            courseObj = await db.query("INSERT INTO course (course_code,section_number,faculty_initial,total_seat,remaining_seat) VALUES (?,?,?,?,?) ", [courseName, sectionNumber, facultyInitial, parseInt(totalSeat), parseInt(totalSeat) - 1])
            courseObj['courseId'] = courseObj[0]['insertId']

        } else {
            courseObj['courseId'] = courseObj[0][0]["id"]
            console.log(courseObj[0][0]['remaining_seat'])
            if (courseObj[0][0]['remaining_seat'] == 0) {
                fullBooked = true
            } else {
                const updateSeat = await db.query("UPDATE course SET remaining_seat=remaining_seat-1 where id=?", [courseObj['courseId']])
            }

        }
        timing.forEach(async (elem) => {

            timeArr = elem.timeRange.split("-")
            let day = elem.day
            let start_time = timeArr[0]
            let end_time = timeArr[1]
            let buildingNumber = elem.buildingNumber
            try {
                let timeList = await db.query("SELECT * from timing where day_of_week=? AND start_time=? AND end_time=? AND building_code=?", [day, start_time, end_time, buildingNumber])

                if (timeList[0].length == 0) {
                    timeList = await db.query("INSERT INTO timing (day_of_week,start_time,end_time,building_code) VALUES (?,?,?,?)", [day, start_time, end_time, buildingNumber])
                    timeList['id'] = timeList[0]['insertId']
                } else {

                    timeList['id'] = timeList[0][0]['id']
                }
                const insert_course = await db.query("INSERT INTO taken (course_id,timing_id) VALUES (?,?) ON DUPLICATE KEY UPDATE course_id=course_id", [courseObj['courseId'], timeList['id']])
            } catch (e) {
                console.log(e)
            }
        })

        try {
            if (fullBooked == false) {
                try {
                    const enrollStudent = await db.query("INSERT INTO enrollment (student_email,course_id) VALUES(?,?)", [userObj['email'], courseObj['courseId']])

                } catch (error) {
                    console.log(error)
                }

                res.status(200).json({ mesage: "enrolled" })
            } else {
                res.status(403).json({ message: "all seat booked" })
            }


        } catch (e) {
            res.end()
        }
    } catch (e) {
        console.log(e)
        res.json(e).status(400)

    }

})





app.put("/student/course/unselect", async (req, res) => {
    try {
        const db = await dbConnect()
        console.log(req.body)
        const { courseName, sectionNumber, email } = req.body
        const course = await db.query("SELECT id from course WHERE course_code=?", [courseName])
        const course_id = course[0][0]['id']
        const unSelectCourse = await db.query("DELETE FROM enrollment WHERE student_email=? AND course_id=?", [email, course_id])
        const updateCourse = await db.query("UPDATE course set remaining_seat=remaining_seat+1")
        res.json({ message: "course dropped" })
    } catch (e) {
        console.log(e)
    }
})

app.get('/admin/get', async (req, res) => {
    try {
        const db = await dbConnect()
        const adminInfo = await db.query("SELECT * from admin_table")

        res.json(adminInfo[0])
    } catch (e) {
        console.log(e)
    }
})
app.post("/admin/post/text", async (req, res) => {
    try {
        const db = await dbConnect()
        console.log(req.body)

        const adminInput = await db.query("UPDATE admin_table set text=? where admin_email=?", [req.body.adminEmail, req.body.text])
        res.json({ text: req.body.text })
    } catch (e) {
        console.log(e)

    }
})
app.post('/admin/blacklist/post', async (req, res) => {
    try {
        const db = await dbConnect()
        const adminInput = await db.query("INSERT INTO blacklist (email) values(?)", [req.body.email])
        res.json({})
    } catch (e) {
        console.log(e)
    }
})
app.get('/admin/blacklist/get', async (req, res) => {
    try {

        const db = await dbConnect()
        const adminInput = await db.query("SELECT * from blacklist")
        res.json(adminInput[0])
    } catch (e) {
        console.log(e)
    }
})

app.post('/admin/blacklist/remove', async (req, res) => {
    const db = await dbConnect()

    const removeEmail = db.query("DELETE FROM blacklist where email=?", [req.body.email])
    res.json({})
})



app.post("/student/course/get-saved-data", async (req, res) => {
    const db = await dbConnect()

    const find = await db.query(`SELECT
    email,
    course_code,
    section_number,
    faculty_initial,
    day_of_week,
    start_time,
    end_time,
    building_code
  from
    student,
    enrollment,
    course,
    taken,
    timing
  WHERE
    student.email = enrollment.student_email
    AND enrollment.course_id = course.id
    AND taken.course_id = course.id
    AND taken.timing_id = timing.id`)

    console.log()
    res.status(200).json(find[0])

})

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
})
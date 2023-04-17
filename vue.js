const { createApp } = Vue

createApp({
    data() {
        return {
            window,
            loggedIn: false,
            auth0Client: null,
            baseUrl: "http://localhost:5000",
            isAdmin: false,
            blacklistEmail: "",
            amIBlackListed: false,
            blacklistArr: [],
            adminText: '',
            user: "",
            data: [],
            curr: [],
            saved: [],
            takenCourseArr: [],
            mainInput: "",
            filterArg: {
                "course Code": [],
                "Program": [],
                "Faculty": [],
                "Day, Time, Room": []
            }
        }
    },

    computed: {

        filtered() {

            let ret = []

            for (let row of this.data) {
                for (let arg in this.filterArg) {

                    if (this.filterArg[arg].includes(row[arg])) {
                        ret.push(row)

                    }
                }
            }

            return (ret.length > 0) ? ret : this.data
        },

        options() {
            let tempOptions = {}
            for (let arg in this.filterArg) {
                tempOptions[arg] = new Set()
            }

            for (let row of this.data) {
                for (let key in tempOptions) {
                    tempOptions[key].add(row[key])

                }
            }


            return tempOptions
        }
    },
    methods: {

        async getData() {
            const parser = new DOMParser();

            try {
                let table
                const url = 'https://corsproxy.io/?' + encodeURIComponent('https://admissions.bracu.ac.bd/academia/admissionRequirement/getAvailableSeatStatus');
                const tempdata = await fetch(`${url}`);
                const htmlData = await tempdata.text()
                table = parser.parseFromString(htmlData, 'text/html').body.querySelector("#customers");

                // remove predefined styles
                table.querySelectorAll("td").forEach((e) => { e.setAttribute("style", "") })
                //adding table classes
                // table.classList.add("table", "table-bordered", "table-dark", "table-hover", "table-striped")


                let tHeader = table.querySelector("thead")
                let tbody = table.querySelector("tbody")

                let rows = tbody.querySelectorAll("tr")

                let headerColumns = tHeader.querySelectorAll("td")
                // headerColumns.forEach(e => { this.options[e.innerText.trim()] = new Set() })
                rows.forEach(row => {
                    let tempRow = {
                        "course Code": row.children[1].innerText,
                        "Program": row.children[2].innerText,
                        "Faculty": row.children[3].innerText,
                        "Credit": row.children[4].innerText,
                        "Section": row.children[5].innerText,
                        "Day, Time, Room": row.children[6].innerText.match(/([A-Za-z]{2}\(.+?\))/g),
                        "Total Seat": row.children[7].innerText,
                        "Seat Booked": row.children[8].innerText,
                        "Seat Remaining": row.children[9].innerText
                    }
                    this.data.push(tempRow)
                })


            } catch (e) {
                console.log(e);
            }
        },
        async selectCourse(event) {
            const isSelected = event.target.checked
            currentRow = event.target.parentNode.parentNode
            const courseName = currentRow.childNodes[1].innerText
            const facultyInitial = currentRow.childNodes[3].innerText
            const sectionNumber = currentRow.childNodes[4].innerText
            const timings = currentRow.childNodes[6]
            const totalSeat = currentRow.childNodes[8].innerText
            const toastElem = document.getElementById('liveToast')
            const timingsArr = timings.querySelectorAll('li')
            let timingArrVals = []
            timingsArr.forEach(e => timingArrVals.push(e.innerText))
            const allThs = document.querySelectorAll(".time-th")


            const courseObj = { courseName, facultyInitial, sectionNumber, totalSeat, timing: [] }

            let isAvailable = true


            if (isSelected && this.takenCourseArr.includes(courseName)) {
                isAvailable == false
                event.target.checked = false
                toastElem.querySelector(".toast-body").innerText = `Course ${courseName} already taken`
                const toast = new bootstrap.Toast(toastElem)
                toast.show()
                return

            }

            timingArrVals.forEach((e) => {
                const timingsText = e.slice(3, e.length - 1)
                const day = e.slice(0, 2)
                const buildingNumber = "UB" + timingsText.split('UB')[1]
                const timeRange = timingsText.split('UB')[0].slice(0, -1)



                for (let elem of allThs) {
                    if (elem.textContent.includes(timeRange)) {
                        let index
                        if (day == "Su") index = 1
                        if (day == 'Mo') index = 2
                        if (day == 'Tu') index = 3
                        if (day == 'We') index = 4
                        if (day == 'Th') index = 5
                        if (day == 'Fr') index = 6
                        if (day == 'Sa') index = 7

                        if (isSelected && elem.parentNode.childNodes[index].innerText != '') {
                            isAvailable = false
                            event.target.checked = false

                            toastElem.querySelector(".toast-body").innerText = `Course overlaps with ${elem.parentNode.childNodes[index].innerText}`
                            const toast = new bootstrap.Toast(toastElem)
                            toast.show()

                        }
                    }
                }

                if (isAvailable == false) {
                    return
                }

                for (let elem of allThs) {
                    if (elem.textContent.includes(timeRange)) {
                        let index
                        if (day == "Su") index = 1
                        if (day == 'Mo') index = 2
                        if (day == 'Tu') index = 3
                        if (day == 'We') index = 4
                        if (day == 'Th') index = 5
                        if (day == 'Fr') index = 6
                        if (day == 'Sa') index = 7
                        if (isSelected && elem.parentNode.childNodes[index].innerText == '') {
                            elem.parentNode.childNodes[index].innerText = `${courseName}-${sectionNumber}-${facultyInitial}-${buildingNumber}`
                            courseObj['timing'].push({ day, timeRange, buildingNumber })
                            this.takenCourseArr.push(courseName)
                        } else if (isSelected == false && elem.parentNode.childNodes[index].innerText != '') {
                            elem.parentNode.childNodes[index].innerText = ""

                            this.takenCourseArr.splice(this.takenCourseArr.indexOf(courseName), 1);
                        }
                    }
                }
            })

            if (isSelected && isAvailable && this.user != "") {

                await this.sendSelectedCourseDetails({ ...courseObj, email: this.user.email, name: this.user.name })
            }

            if (isSelected == false && this.user != "") {

                await this.sendUnselectedCourseDetails({ ...courseObj, email: this.user.email, name: this.user.name })
                this.takenCourseArr.splice(this.takenCourseArr.indexOf(obj.courseName), 1);
            }


        },
        async selectProgram(event) {
            event.target.parentNode.parentNode.parentNode.querySelector('a').innerText = event.target.innerText
            this.filterArg["Program"] = [event.target.innerText]
        },
        async resetProgram(event) {
            this.filterArg["Program"] = []
            event.target.parentNode.parentNode.parentNode.querySelector('a').innerText = "Program"


        },
        async selectFaculty(event) {
            if (event.target.checked) {
                this.filterArg["Faculty"].push(event.target.parentNode.innerText)
            } else {
                for (let i = 0; i < this.filterArg["Faculty"].length; i++) {

                    if (this.filterArg["Faculty"][i].includes(event.target.parentNode.innerText)) {
                        this.filterArg["Faculty"].splice(i, 1);
                        i--;
                    }
                }
            }
        },
        async selectCourseFromDropDown(event) {
            if (event.target.checked) {
                this.filterArg["course Code"].push(event.target.parentNode.innerText)
            } else {
                for (let i = 0; i < this.filterArg["course Code"].length; i++) {
                    if (this.filterArg["course Code"][i].includes(event.target.parentNode.innerText)) {
                        this.filterArg["course Code"].splice(i, 1);
                        i--;
                    }
                }
            }
        },

        async login(targetUrl) {
            try {
                console.log("Logging in", targetUrl);

                const options = {
                    authorizationParams: {
                        redirect_uri: window.location.origin
                    }
                };

                if (targetUrl) {
                    options.appState = { targetUrl };
                }

                await this.auth0Client.loginWithRedirect(options);

            } catch (err) {
                console.log("Log in failed", err);
            }
        },
        async logout() {
            try {
                console.log("Logging out");
                await this.auth0Client.logout({
                    logoutParams: {
                        returnTo: window.location.origin
                    }
                });
            } catch (err) {
                console.log("Log out failed", err);
            }
        },


        async configureClient() {
            const config = {
                "domain": "dev-byqyk3bvatosei5p.us.auth0.com",
                "clientId": "OUuZb4YprerDwWoQ4aVqzWeFd8vh7tvh"
            }
            this.auth0Client = await auth0.createAuth0Client({
                domain: config.domain,
                clientId: config.clientId
            });
            const query = this.window.location.search;
            const shouldParseResult = query.includes("code=") && query.includes("state=");
            if (shouldParseResult) {
                console.log("> Parsing redirect");
                try {
                    const result = await this.auth0Client.handleRedirectCallback();

                    console.log("Logged in!");
                } catch (err) {
                    console.log("Error parsing redirect:", err);
                }

                this.window.history.replaceState({}, document.title, "/");
            }

            if (await this.auth0Client.isAuthenticated()) {
                this.loggedIn = true
                const user = await this.auth0Client.getUser();

                this.user = user
                await this.getCourseDetails()
            }
        },

        async sendSelectedCourseDetails(obj) {

            try {
                const data = await fetch(this.baseUrl + "/student/course/select", {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(obj)
                })
                if (data.ok) {
                    const toastElem = document.getElementById('liveToast')
                    toastElem.querySelector(".toast-body").innerText = `Course enrolled successfully`
                    const toast = new bootstrap.Toast(toastElem)
                    toast.show()
                }

                if (data.status == 403) {
                    const toastElem = document.getElementById('liveToast')
                    toastElem.querySelector(".toast-body").innerText = `all seats are taken`
                    const toast = new bootstrap.Toast(toastElem)
                    toast.show()
                }


            } catch (e) {
                console.log(e)
            }
        },








        async sendUnselectedCourseDetails(obj) {

            try {
                const data = await fetch(this.baseUrl + '/student/course/unselect', {
                    method: 'PUT', headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(obj)
                })
                if (data.ok) {

                    console.log(await data.json())
                }


            } catch (e) {
                console.log(e)
            }
        },


        async getCourseDetails() {
            try {
                const data = await fetch(this.baseUrl + "/student/course/get-saved-data", {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.user)
                })
                let resp = await data.json()
                console.log()
                const courseRow = document.querySelectorAll('.course-row')
                resp.forEach((savedCourse) => {
                    courseRow.forEach((e) => {
                        const savedCourseName = savedCourse.course_code
                        const savedSection = savedCourse.section_number
                        let chkbox = e.querySelector('input')

                        let course = e.children[1].innerText
                        // let faculty = e.children[3].innerText
                        let section = e.children[4].innerText
                        if (savedCourseName == course && savedSection == section) {
                            chkbox.setAttribute('checked', true)
                            this.takenCourseArr.push(savedCourseName)
                        }

                    })
                    // console.log(savedCourse)
                })

                console.log(resp)
            } catch (e) {
                console.log(e)
            }
        },

        async getAdmin() {
            try {
                const data = await fetch(this.baseUrl + "/admin/get", {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }

                })
                let resp = await data.json()

                resp.forEach((e) => {

                    if (e['admin_email'] == this.user.email) {
                        this.isAdmin = true
                        this.adminText = e.text
                    }
                })
                console.log(this.adminText)

            } catch (e) {
                console.log(e)
            }
        },
        async postBlacklist(event) {
            event.preventDefault()
            try {
                let email = document.querySelector('#blacklistInput')
                this.blacklistArr = [...this.blacklistArr, email.value]

                let temp = email.value
                console.log(email.value)
                const data = await fetch(this.baseUrl + "/admin/blacklist/post", {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: temp })
                })
                email.value = ""

                let resp = await data.json()
            } catch (e) {
                console.log(e)
            }
        },

        async removeBlacklist(event) {
            event.preventDefault()

            let target = event.target.parentNode
            let targetEmail = target.childNodes[0].innerText
            console.log(targetEmail.trim())
            target.parentNode.removeChild(target);
            try {
                const data = await fetch(this.baseUrl + "/admin/blacklist/remove", {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }, body: JSON.stringify({ email: targetEmail.trim() })

                })

                let resp = await data.json()
                console.log(resp)
            } catch (e) {
                console.log(e)
            }
        },

        async getBlackList() {
            try {
                const data = await fetch(this.baseUrl + "/admin/blacklist/get", {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }

                })
                let resp = await data.json()

                resp.forEach((e) => {
                    this.blacklistArr.push(e.email)
                    if (this.user.email == e.email) {
                        this.amIBlackListed = true
                    }
                })
                console.log(this.amIBlackListed)

            } catch (e) {
                console.log(e)
            }
        },


        async postText() {
            try {
                const data = await fetch(this.baseUrl + "/admin/post/text", {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ adminEmail: this.user.email, text: this.adminText })
                })
                let resp = await data.json()
                console.log(resp)
            } catch (e) {
                console.log(e)
            }
        },

        async preventLogin() {

        }


    },
    async mounted() {
        await this.getData()
        await this.configureClient();
        await this.getAdmin()
        await this.getBlackList()

    }
}).mount('#tableDiv')


const { createApp } = Vue

createApp({
    data() {
        return {
            window,
            loggedIn: false,
            auth0Client: null,

            user: "",
            data: [],
            curr: [],
            saved: [],
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
            const timingsArr = timings.querySelectorAll('li')
            let timingArrVals = []
            timingsArr.forEach(e => timingArrVals.push(e.innerText))
            const allThs = document.querySelectorAll(".time-th")

            let isAvailable = true
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
                            const toastElem = document.getElementById('liveToast')
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
                        } else if (isSelected == false && elem.parentNode.childNodes[index].innerText != '') {
                            elem.parentNode.childNodes[index].innerText = ""
                        }
                    }
                }
            })
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

                    // if (result.appState && result.appState.targetUrl) {
                    //     showContentFromUrl(result.appState.targetUrl);
                    // }

                    console.log("Logged in!");
                } catch (err) {
                    console.log("Error parsing redirect:", err);
                }

                this.window.history.replaceState({}, document.title, "/");
            }

            if (await this.auth0Client.isAuthenticated()) {
                this.loggedIn = true
                const user = await this.auth0Client.getUser();
                console.log(user)
                this.user = user

            }
        }

    },
    async mounted() {
        this.getData()
        this.configureClient();

    }
}).mount('#tableDiv')


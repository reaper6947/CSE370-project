const { createApp } = Vue

createApp({
    data() {
        return {

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

            for (let row of this.filtered) {
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
                if (localStorage.getItem("courseArr")) {

                    table = parser.parseFromString(localStorage.getItem("courseArr"), 'text/html').body.querySelector("#customers");
                } else {
                    const tempdata = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent('https://admissions.bracu.ac.bd/academia/admissionRequirement/getAvailableSeatStatus')}`);
                    const htmlData = await tempdata.text()

                    table = parser.parseFromString(htmlData, 'text/html').body.querySelector("#customers");
                    localStorage.setItem('courseArr', htmlData)
                }


                // remove predefined styles
                table.querySelectorAll("td").forEach((e) => { e.setAttribute("style", "") })
                //adding table classes
                // table.classList.add("table", "table-bordered", "table-dark", "table-hover", "table-striped")
                // console.log(table)

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

                    // console.log(row.children[6].innerText)
                    this.data.push(tempRow)


                })

                // document.querySelector("#customers").append(tbody)
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
            timingArrVals.forEach((e) => {
                const timingsText = e.slice(3, e.length - 1)

                const day = e.slice(0, 2)
                const buildingNumber = "UB" + timingsText.split('UB')[1]
                const timeRange = timingsText.split('UB')[0].slice(0, -1)

                for (let elem of allThs) {


                    if (elem.textContent.includes(timeRange)) {
                        console.log(elem.parentNode)
                        let index
                        if (day == "Su") index = 1
                        if (day == 'Mo') index = 2
                        if (day == 'Tu') index = 3
                        if (day == 'We') index = 4
                        if (day == 'Th') index = 5
                        if (day == 'Fr') index = 6
                        if (day == 'Sa') index = 7

                        if (isSelected && elem.parentNode.childNodes[index].innerText == '') {
                            elem.parentNode.childNodes[index].innerText = `${courseName}-${facultyInitial}-${buildingNumber}`
                        } else if (isSelected && elem.parentNode.childNodes[index].innerText != '') {

                            const toastElem = document.getElementById('liveToast')
                            toastElem.querySelector(".toast-body").innerText = `Course overlaps with ${courseName}`
                            const toast = new bootstrap.Toast(toastElem)
                            toast.show()
                        }
                    }
                }
            })

            console.log(isSelected, courseName, facultyInitial, sectionNumber, timingArrVals)



        }
    },
    mounted() {
        this.getData()
    }
}).mount('#tableDiv')
$(document).ready(function () {

    const excelFilePath = 'file:///C:/Users/Ritesh.Yawale/Desktop/USDH%20Details/EXCEL%20UPLOAD%20JOB/pr.xlsx';
    
    $("#submitbtn").prop('disabled', true);
    $('#jobSkillSelect').chosen({
        width: '100%',
        no_results_text: 'No skills found!',
        placeholder_text_multiple: 'Select Job Skills',
    });
    $('#jobTitleSelect').chosen({
        width: '100%',
        no_results_text: 'No Titles found!',
        placeholder_text_multiple: 'Job Titles',
    });
    $('#jobTitleSelect').prop('disabled', true).trigger('chosen:updated');
    function loadExcelData(filePath) {
        fetch(filePath)
            .then(response => response.arrayBuffer())
            .then(data => {
                const workbook = XLSX.read(data, { type: 'array' });
                for (var i = 0; i < 4; i++) {
                    const sheetName = workbook.SheetNames[i];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    switch (i) {
                        case 0:
                            excel1 = jsonData;
                            break;
                        case 1:
                            excel2 = jsonData;
                            break;
                        case 2:
                            excel3 = jsonData;
                            break;
                        case 3:
                            excel4 = jsonData;
                            break;
                        default:
                            break;
                    }
                    populateTable(jsonData, i);
                    console.log(jsonData);
                }
                uniqueLevels = [...new Set(excel2.map(row => row[0]))];
                uniqueLevels = uniqueLevels.slice(1);
                const selectDropdown = document.getElementById('jobLevelSelect');
                uniqueLevels.forEach(level => {
                    const option = document.createElement('option');
                    option.value = level;
                    option.textContent = `${level}`;
                    selectDropdown.appendChild(option);
                });

            })
            .catch(error => console.error('Error reading Excel file:', error));
    }

    function populateTable(data, i) {
        const headerRow = data[0];
        bodyRows = data.slice(1);
        const headerHtml = headerRow.map(cell => `<th>${cell}</th>`).join('');
        $('#excelHeader' + (i + 1)).html(headerHtml);
        const bodyHtml = bodyRows.map(row => {
            return `<tr>${row.map(cell => `<td>${cell || ''}</td>`).join('')}</tr>`;
        }).join('');
        $('#excelBody' + (i + 1)).html(bodyHtml);
    }
    
    $("#fileInput").on("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });

                for (let i = 0; i < 4; i++) {
                    const sheetName = workbook.SheetNames[i];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    switch (i) {
                        case 0:
                            excel1 = jsonData;
                            break;
                        case 1:
                            excel2 = jsonData;
                            break;
                        case 2:
                            excel3 = jsonData;
                            break;
                        case 3:
                            excel4 = jsonData;
                            break;
                        default:
                            break;
                    }
                    populateTable(jsonData, i);
                    console.log(jsonData);
                }
                uniqueLevels = [...new Set(excel2.map(row => row[0]))];
                uniqueLevels = uniqueLevels.slice(1);
                const selectDropdown = document.getElementById('jobLevelSelect');
                uniqueLevels.forEach(level => {
                    const option = document.createElement('option');
                    option.value = level;
                    option.textContent = `${level}`;
                    selectDropdown.appendChild(option);
                });

            };
            reader.readAsArrayBuffer(file);
        } else {
            console.error("No file selected.");
        }
    });

    $('#jobLevelSelect').on('change', function () {
        $('#jobSkillSelect').empty();
        $('#jobTitleSelect').empty();
        var filteredSkillLevels = null;
        const selectedTitle = $(this).val();
        filteredLevels = [...new Set(excel2
            .filter(row => row[0] === parseInt(selectedTitle))
            .map(row => row[1])
        )];
        filteredLevels = filteredLevels.flatMap(item => item.split(/\r\n|\n|\r/));
        filteredLevels = filteredLevels.map(item => item.trim());
        filteredLevels = filteredLevels.filter((value, index, self) => {
            return self.indexOf(value.trim()) === index;
        });
        filteredLevels.forEach(level => {
            $('#jobTitleSelect').append(`<option value="${level}">${level}</option>`);
            $(`#jobTitleSelect option[value="${level}"]`).prop('selected', true);
        });
        $('#jobTitleSelect').prop('disabled', true).trigger('chosen:updated');


        filteredSkillLevels = [...new Set(excel3
            .filter(row => row[0] === parseInt(selectedTitle))
            .map(row => row[3])
        )];
        filteredSkillLevels.forEach(level => {
            level = level.replace(/\r\n|\n|\r/g, '').trim();
            $('#jobSkillSelect').append(`<option value="${level}">${level}</option>`);
        });
        $('#jobSkillSelect').trigger('chosen:updated');
        

        if ($("#jobSkillSelect").val().length == 0 || $("#jobLevelSelect").val() == null) {
            $("#submitbtn").prop('disabled', true);
        } else {
            $("#submitbtn").prop('disabled', false);
        }
    });

    $('#jobSkillSelect').on('change', function () {
        if ($("#jobSkillSelect").val().length == 0 || $("#jobLevelSelect").val() == null) {
            $("#submitbtn").prop('disabled', true);
        } else {
            $("#submitbtn").prop('disabled', false);
        }
    });
});

var bodyRows;
var excel1;
var excel2;
var excel3;
var excel4;

function SubmitForm() {
    var skill = $("#jobSkillSelect").val()
    var level = $("#jobLevelSelect").val()
    var title = $("#jobTitleSelect").val()
    var filteredLevel1 = [...new Set(excel1.filter(row => row[0].includes(level) ))];
    var filteredLevel2 = [...new Set(excel2.filter(row => row[0] == parseInt(level) ))];
    var filteredLevel3 = [...new Set(excel3.filter(row => row[0] == parseInt(level) && skill.includes(row[3])))];
    var filteredLevel4 = [...new Set(excel4.filter(row => row[0] == parseInt(level) ))];

    var combinedArrays = [...new Set(filteredLevel1.concat(filteredLevel2, filteredLevel3, filteredLevel4))];
    
    var array1=[['Job Level',level]];
    var array2=[['Job Title',title.join(", ")]]
    var array3=[['Purpose',filteredLevel1[0][4]]]
    var array4=[['','','']];
    var array5 = []; 
    filteredLevel2.forEach(element => {
        array5.push(['', element[3], element[4]]);
    });
    array5[0][0]="Required Skills";
    var array6=[['','','']];
    var array7 = []; 
    filteredLevel3.forEach(element => {
        array7.push(['', element[3], element[4]]);
    });
    array7[0][0]="Variable Skills";
    var array8=[['','','']];
    var array9 = []; 
    filteredLevel4.forEach(element => {
        array9.push(['', element[2], element[3]]);
    });
    array9[0][0]="Experience and Education";

    var combinedArray = [...new Set(array1.concat(array2, array3,array4,array5,array6,array7,array8,array9))];
    
    const ws = XLSX.utils.aoa_to_sheet(combinedArray);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "job_data.xlsx");
}
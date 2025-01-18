let commentList = null;
var DropDownSchema = null;
var DisplayCommentList = null;

function GetAllComments() {
  var url = getApiUrl("GetAllComments");

  var xhr = createCORSRequest("GET", url);
  let _ClientName = __session.Get("clientname");
  xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
  xhr.setRequestHeader("ClientName", _ClientName);
  xhr.setRequestHeader("Authorization", `Bearer ${AuthService.FetchToken()}`);
  if (xhr != null) {
    xhr.send(null);

    xhr.onload = function (ev) {
      var json = this.response;

      var objSchema = JSON.parse(json);
      //-----------------------------//
      $("#loaderForPage").hide();
      $("#dvGrid").show();
      //-----------------------------//
      commentList = objSchema.dataset;
      GetAllDropdownInfo();

      for (var i in objSchema.dataset) {
        //remove T and add space in date string
        if (
          objSchema.dataset[i].ModifiedDate != null &&
          objSchema.dataset[i].ModifiedDate.includes("T")
        )
          objSchema.dataset[i].ModifiedDate = objSchema.dataset[
            i
          ].ModifiedDate.replace(/\T/g, "<br/>");

        //set edit button html
        objSchema.dataset[
          i
        ].Edit = `<button type="button" name="${objSchema.dataset[i].Id}"  onclick="editRecord(this)" class="btn" title="Edit">
        <i class="bi bi-pencil-square text-dark fs-3"></i>
        </button>
      `;;

        //set isActive to active if value is 1
        if (objSchema.dataset[i].IsActive) {
          objSchema.dataset[i].ActiveStatus = "Active";
        } else {
          objSchema.dataset[i].ActiveStatus = "Not Active";
        }
      }

      objSchema.fields = [
        // {
        //   name: "Id",
        //   type: "number",
        //   title: "ID",
        //   align: "center",
        //   width: 100,
        // },
        // {
        //   name: "Name",
        //   type: "text",
        //   title: "Name",
        //   align: "center",
        //   width: 130,
        // },
        {
          name: "Code",
          type: "text",
          title: "Code",
          align: "center",
          width: 150,
        },
        {
          name: "CommentText",
          type: "text",
          title: "Comment",
          //align: "center",
          width: 370,
        },
        {
          name: "Category",
          type: "text",
          title: "Category",
          filtering: false,
          align: "center",
          width: 80,
        },
        {
          name: "ActiveStatus",
          type: "text",
          title: "Active Status",
          filtering: false,
          align: "center",
          width: 80,
        },
        {
          name: "ModifiedDate",
          type: "Date",
          title: "Last Edited",
          filtering: false,
          align: "center",
          width: 80,
        },
        {
          name: "Edit",
          type: "text",
          sorting: false,
          title: "Edit",
          filtering: false,
          align: "center",
          width: 40,
        },
        { type: "control", width: 35, editButton: false, deleteButton: false },
      ];

      __gridSchema = objSchema;

      $("#dvGrid").jsGrid({
        width: __gridSchema.width,
        height: __gridSchema.height,
        sorting: __gridSchema.sorting,
        paging: __gridSchema.paging,
        data: __gridSchema.dataset,
        fields: __gridSchema.fields,
        filtering: true,
        controller: {
          loadData: function (item) {
            return search();
          },
        },
      });
    };

    xhr.onerror = function (err) {
      //console.log(err);
      //toastr
      //-----------------------------//
      $("#loaderForPage").hide();
      $("#dvGrid").show();
      //-----------------------------//
      errorToastr("MastersAlert", "RecordFetchingFailed");
    };
  } else {
    errorToastr("CommonAlert", "CORSError");
  }
}

function GetAllDropdownInfo() {
  try {
    var url = getApiUrl("GetAllMappingInfo");
    var xhr = createCORSRequest("GET", url);
    let _ClientName = __session.Get("clientname");
    xhr.setRequestHeader("ClientName", _ClientName);
    xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
    xhr.setRequestHeader("Authorization", `Bearer ${AuthService.FetchToken()}`);

    if (xhr != null) {
      xhr.send(null);

      xhr.onload = function (ev) {
        var json = this.response;

        DropDownSchema = JSON.parse(json);
      };
    }
  } catch (error) {
    console.error("GetAllDropdownInfos()Error ->" + error);
    //=======================================//
    //=======================================//
  }
}

function search() {
  let filter = $("#dvGrid").jsGrid("getFilter");

  let result = $.grep(commentList, function (item) {
    return (
      (!filter.Id || parseInt(filter.Id) == item.Id) &&
      // (!filter.Name != "" ||
      //   (item.Name != null &&
      //     item.Name.toLowerCase().indexOf(filter.Name.toLowerCase()) > -1)) &&
      (!filter.Code != "" ||
        (item.Code != null &&
          item.Code.toLowerCase().indexOf(filter.Code.toLowerCase()) > -1)) &&
      (!filter.CommentText != "" ||
        (item.CommentText != null &&
          item.CommentText.toLowerCase().indexOf(
            filter.CommentText.toLowerCase()
          ) > -1))
    );

    //&& (!filter.EmployeeID != "" || item.EmployeeID != null && item.EmployeeID.toLowerCase().indexOf(filter.EmployeeID.toLowerCase()) > -1);
  });

  return result;
}

function editRecord(obj) {
  try {
    var cid = obj.getAttribute("name");
    processPageOnCondition("Edit", cid);
  } catch (error) {
    console.log("Error ->" + error);
  }
}

// Method to upload a valid excel file
function CommentUpload() {
  var files = document.getElementById("excelCommentUpload").files;
  if (files.length == 0) {
    $("#excelCommentUpload").val("");
    Swal.fire({
      icon: "warning",
      title: "Please choose any file...",
      showConfirmButton: false,
      timer: 2200,
    });
    return;
  }
  var filename = files[0].name;
  var extension = filename.substring(filename.lastIndexOf(".")).toUpperCase();
  if (extension == ".XLS" || extension == ".XLSX") {
    CommentexcelFileToJSON(files[0]);
  } else {
    $("#excelCommentUpload").val("");
    Swal.fire({
      icon: "warning",
      title: "Please select a valid excel file.",
      showConfirmButton: false,
      timer: 2200,
    });
  }
}

//Method to read excel file and convert it into JSON
function CommentexcelFileToJSON(file) {
  try {
    var reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = function (e) {
      var data = e.target.result;
      var workbook = XLSX.read(data, {
        type: "binary",
      });
      var result = {};
      var checkflag = true;
      workbook.SheetNames.forEach(async function (sheetName) {
        if (sheetName == "Comment_Master_Sheet") {
          var commentrow = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
          var SetCodeValue = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]).split(",").indexOf("Code");
          if (commentrow.length == 0) {
            console.error("excel file is empty");
            $("#excelCommentUpload").val("");
            Swal.fire({
              icon: "error",
              title: "Missing Comment Data Fields",
              showConfirmButton: false,
              timer: 2200,
            });
            return;
          }
          CommentTrimUndefinedInValidMethod(commentrow, sheetName);
          // CommentCheckDropdownEntries(commentrow, sheetName);
          checkflag = CommentFieldsCheck(commentrow, sheetName);
          if (checkflag == false) {
            CommentToJsGrid(commentrow, SetCodeValue);
            return;
          } else {
            await CommentUploadToDB(commentrow, sheetName);
            
            await Swal.fire({
              icon: "success",
              title: "Comment Data Uploaded Successfully",
              showConfirmButton: false,
              timer: 2500,
            });
            $("#loaderForPage").hide();
            $("#excelProviderUpload").val("");
              document.location.reload();
          }
        }
      });
      if (workbook.SheetNames[0] != "Comment_Master_Sheet") {
        $("#excelCommentUpload").val("");
        Swal.fire({
          icon: "warning",
          title: "Please select valid Comment sheet",
          showConfirmButton: false,
          timer: 2200,
        });
        return;
      }
    };
  } catch (e) {
    console.error(e);
  }
}

// loop to check sufficient data columns and add undefined and trim  to row array
function CommentTrimUndefinedInValidMethod(commentrow, sheetName) {
 

  if (sheetName == "Comment_Master_Sheet") {
    for (var i = 0; i < commentrow.length; i++) {
      if (commentrow[i].Code == undefined) { commentrow[i].Code = -1; }
      else{commentrow[i].Code = commentrow[i].Code.toString()};
      if (commentrow[i].Name == undefined) { commentrow[i].Name = -1; }
      else{commentrow[i].Name = commentrow[i].Name.toString()};
      if (commentrow[i].CommentText == undefined) { commentrow[i].CommentText = -1; }
      else{commentrow[i].CommentText = commentrow[i].CommentText.toString()};
      if (commentrow[i].Category == undefined) { commentrow[i].Category = -1; }
      else{commentrow[i].Category = commentrow[i].Category.toString().trim()};
      if (commentrow[i].GuidelineEvaluation == undefined) { commentrow[i].GuidelineEvaluation = -1; }
      else{commentrow[i].GuidelineEvaluation = commentrow[i].GuidelineEvaluation.toString().trim()};
      if (commentrow[i].RefillAmount == undefined) { commentrow[i].RefillAmount = -1; }
      else{commentrow[i].RefillAmount = commentrow[i].RefillAmount.toString().trim()};
      if (commentrow[i].ProtocolEvaluation == undefined) { commentrow[i].ProtocolEvaluation = -1; }
      else{commentrow[i].ProtocolEvaluation =commentrow[i].ProtocolEvaluation.toString().trim()};
      if (commentrow[i].ReconTab == undefined) {commentrow[i].ReconTab = -1;}
      else{commentrow[i].ReconTab = commentrow[i].ReconTab.toString().trim()};
      if (commentrow[i].Removed == undefined) {commentrow[i].Removed = -1;}
      else{commentrow[i].Removed = commentrow[i].Removed.toString().trim()};
      if (commentrow[i].SchedulingStaffMsg == undefined) {commentrow[i].SchedulingStaffMsg = -1;}
      else{commentrow[i].SchedulingStaffMsg =commentrow[i].SchedulingStaffMsg.toString().trim()};
      if (commentrow[i].RoutingDisposition == undefined) {commentrow[i].RoutingDisposition = -1;}
      else{commentrow[i].RoutingDisposition =commentrow[i].RoutingDisposition.toString().trim()};
      if (commentrow[i].IsActive == undefined) {commentrow[i].IsActive = -1;}
      else{commentrow[i].IsActive = commentrow[i].IsActive.toString().trim()};
    }
  }

  if (sheetName == "Comment_Master_Sheet") {
    for (var i = 0; i < commentrow.length; i++) {

      if (commentrow[i].GuidelineEvaluation == -1) { commentrow[i].GuidelineEvaluation = 'N/A' }
      if (commentrow[i].RefillAmount == -1) { commentrow[i].RefillAmount = 'N/A' }
      if (commentrow[i].ProtocolEvaluation == -1) { commentrow[i].ProtocolEvaluation = 'N/A' }
      if (commentrow[i].ReconTab == -1) {commentrow[i].ReconTab = 'N/A'}
      if (commentrow[i].Removed == -1) {commentrow[i].Removed = 'N/A'}
      if (commentrow[i].SchedulingStaffMsg == -1) {commentrow[i].SchedulingStaffMsg = 'N/A'}
      if (commentrow[i].RoutingDisposition == -1) {commentrow[i].RoutingDisposition = 'N/A'}
      if (commentrow[i].IsActive == -1) {commentrow[i].IsActive = 'Yes'}
    }
  }

  GuidelineEvaluationListDrop = DropDownSchema.GuidelineEvaluationList;
  ProtocolEvaluationListDrop = DropDownSchema.ProtocolEvaluationList;
  ReconResultListDrop = DropDownSchema.ReconResultList;
  RefillAmountListDrop = DropDownSchema.RefillAmountList;
  ReportsRemovedListDrop = DropDownSchema.ReportsRemovedList;
  RoutingDispositionListDrop = DropDownSchema.RoutingDispositionList;
  SchedulingStaffMessageListDrop = DropDownSchema.SchedulingStaffMessageList;
  WorkflowCategoryMasterListDrop = DropDownSchema.WorkflowCategoryMasterList;

  if (sheetName == "Comment_Master_Sheet") {
    for (var i = 0; i < commentrow.length; i++) {
      if (commentrow[i].Code != -1) { commentrow[i].Code=commentrow[i].Code }
      if (commentrow[i].Name != -1) { commentrow[i].Name = commentrow[i].Name; }
      if (commentrow[i].CommentText != -1) { commentrow[i].CommentText = commentrow[i].CommentText; }
      if (commentrow[i].Category != -1) { commentrow[i].Category = SearchAssignInvalidCommentCategoryValuesInList( commentrow[i].Category, WorkflowCategoryMasterListDrop ); }
      if (commentrow[i].GuidelineEvaluation != -1) { commentrow[i].GuidelineEvaluation = SearchAssignInvalidValuesInList(commentrow[i].GuidelineEvaluation,GuidelineEvaluationListDrop); }
      if (commentrow[i].RefillAmount != -1) { commentrow[i].RefillAmount = SearchAssignInvalidValuesInList( commentrow[i].RefillAmount, RefillAmountListDrop );; }
      if (commentrow[i].ProtocolEvaluation != -1) { commentrow[i].ProtocolEvaluation = SearchAssignInvalidValuesInList( commentrow[i].ProtocolEvaluation, ProtocolEvaluationListDrop );; }
      if (commentrow[i].ReconTab != -1) {commentrow[i].ReconTab = SearchAssignInvalidValuesInList( commentrow[i].ReconTab, ReconResultListDrop );}
      if (commentrow[i].Removed != -1) {commentrow[i].Removed = SearchAssignInvalidValuesInList(commentrow[i].Removed,ReportsRemovedListDrop);}
      if (commentrow[i].SchedulingStaffMsg != -1) {commentrow[i].SchedulingStaffMsg = SearchAssignInvalidValuesInList( commentrow[i].SchedulingStaffMsg, SchedulingStaffMessageListDrop );}
      if (commentrow[i].RoutingDisposition != -1) {commentrow[i].RoutingDisposition = SearchAssignInvalidValuesInList( commentrow[i].RoutingDisposition, RoutingDispositionListDrop );}
      if (commentrow[i].IsActive != -1) {commentrow[i].IsActive = IsActiveInvalidFlag(commentrow[i].IsActive);}
    }
  }
}


// comment master upload fields check
function CommentFieldsCheck(row1, sheetName) {

  if (sheetName == "Comment_Master_Sheet") {
    for (var i = 0; i < row1.length; i++) {
      if (
        row1[i].Removed == -1 ||
        row1[i].Category == -1 ||
        row1[i].RefillAmount == -1 ||
        row1[i].ProtocolEvaluation == -1 ||
        row1[i].SchedulingStaffMsg == -1 ||
        row1[i].RoutingDisposition == -1 ||
        row1[i].GuidelineEvaluation == -1 ||
        row1[i].ReconTab == -1 ||
        row1[i].CommentText == -1 ||
        row1[i].IsActive == -1 ||
        row1[i].Code == -1 ||
        row1[i].Name == -1 ||
        checkDuplicateCodesInExcel(row1) == true ||
        row1[i].Removed == -10 ||
        row1[i].Category == -10 ||
        row1[i].RefillAmount == -10 ||
        row1[i].ProtocolEvaluation == -10 ||
        row1[i].SchedulingStaffMsg == -10 ||
        row1[i].RoutingDisposition == -10 ||
        row1[i].GuidelineEvaluation == -10 ||
        row1[i].ReconTab == -10 ||
        row1[i].IsActive == -10
      ) {
        checkflag = false;
        return checkflag;
      }
    }
  }

}

// function to create comment excel error rows into js grid
function CommentToJsGrid(roa, SetCodeValue) {
  roa.forEach((roa, index) => (roa.rowName = index + 1));
  var msg2 =
    '<label style="color:red ;padding-top: 8px; padding-left: 2px;font-size : 15px;font-family: sans-serif;"><i class="fa fa-times-circle" style="font-size:22px;color:red"></i>&nbsp;&nbsp;&nbsp;Possible error could be - Invalid / Missing / Duplicate Code Fields (highlighted in RED).<label>';
  var msg1 =
    '<table id="commentexample" class="table table-striped table-bordered" style="width:100%;font-weight: 400;"><thead style="position: sticky;top: 0;height: 30px;padding: 100px;"><tr><th></th><th>&nbsp;&nbsp;Code&nbsp;&nbsp;</th><th>&nbsp;&nbsp;Name&nbsp;&nbsp;</th><th>&nbsp;&nbsp;&nbsp;CommentText&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</th><th>Category</th><th>RefillAmount</th><th>GuidelineEvaluation</th><th>SchedulingStaffMsg</th><th>ProtocolEvaluation</th><th>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ReconTab&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</th><th>RoutingDisposition</th><th>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Removed&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</th><th>&nbsp;&nbsp;IsActive&nbsp;&nbsp;</th></tr></thead><tbody class="commentbody1">';

  for (j = 0; j < roa.length; j++) {
    msg1 += "<tr id=row" + (j + 1) + ">";
    msg1 += "<td > Row(" + roa[j].rowName + ")</td>";
    msg1 += "<td >" + roa[j].Code + "</td>";
    msg1 += "<td >" + roa[j].Name + "</td>";
    msg1 += "<td >" + roa[j].CommentText + "</td>";
    msg1 += "<td >" + roa[j].Category + "</td>";
    msg1 += "<td >" + roa[j].RefillAmount + "</td>";
    msg1 += "<td >" + roa[j].GuidelineEvaluation + "</td>";
    msg1 += "<td >" + roa[j].SchedulingStaffMsg + "</td>";
    msg1 += "<td >" + roa[j].ProtocolEvaluation + "</td>";
    msg1 += "<td >" + roa[j].ReconTab + "</td>";
    msg1 += "<td >" + roa[j].RoutingDisposition + "</td>";
    msg1 += "<td >" + roa[j].Removed + "</td>";
    msg1 += "<td >" + roa[j].IsActive + "</td>";
    msg1 += "</tr>";
  }
  msg1 += "</tbody></table>";
  $(".sweet-modal-close-link").css("display", "none");
  $("#excelCommentUpload").val("");
  $.sweetModal({
    title: msg1,
    content: msg2,
    showConfirmButton: true,
    buttons: [
      {
        label: "OK",
        classes: "redB",
      },
    ],
  });
  var columncount =document.getElementById("commentexample").rows[0].cells.length;
  for (var i = 1; i <= roa.length; i++) {
    for (var k = 2; k <= columncount; k++) {
      var initString = "#row" + i + " > td:nth-child(" + k + ")";
      $(initString).css("text-align", "center");
      if ($(initString).text() == -1) {
        $(initString).text("MISSING");
        $(initString).css("color", "red");
      }
      if ($(initString).text() == -10) {
        $(initString).text("INVALID");
        $(initString).css("color", "red");
      }
    }
  }
  if (checkDuplicateCodesInExcel(roa) == true) {
    for (var i = 0; i < roa.length - 1; i++) {
      for (var k = i + 1; k < roa.length; k++) {
        if (roa[k].Code.toString().trim().toLowerCase() == roa[i].Code.toString().trim().toLowerCase()) {
          $("#row" + (k + 1) + " > td:nth-child(" + (SetCodeValue + 2) + ")").css("color", "red");
        }
      }
    }
  }
  var rowsall = new Set();
  for (var i = 1; i <= roa.length; i++) {
    rowsall.add(i);
  }
  var rowsToBeShown = new Set();
  for (var i = 1; i <= roa.length; i++) {
    for (var k = 1; k <= columncount; k++) {
      if ($("#row" + i + " > td:nth-child(" + k + ")").css("color") =="rgb(255, 0, 0)") {
        rowsToBeShown.add(i);
        break;
      }
    }
  }

  var setat = new Set();
  setat = getDifference(rowsall, rowsToBeShown);

  var settoarray = [...setat];
  var settoarray = [];
  setat.forEach((v) => settoarray.push(v));
  for (var m = 0; m < settoarray.length; m++) {
    $("#row" + settoarray[m] + "").css("display", "none");
  }
  $(".sweet-modal-close-link").css("display", "none");
}

// function to upload comment to db
async function CommentUploadToDB(commentrow, sheetName) {
  if (commentrow.length > 0) {
    var url = null;
    $("#loaderForPage").show();
    var commentobj = {};
    if (sheetName == "Comment_Master_Sheet") {
      for (var i = 0; i < commentrow.length; i++) {

        commentobj.Code = commentrow[i].Code.trim();
        commentobj.Name = commentrow[i].Name.trim();
        commentobj.CommentText = commentrow[i].CommentText.trim();

        commentobj.CategoryId =SearchAssignFinalCommentCategoryValuesInList(commentrow[i].Category,DropDownSchema.WorkflowCategoryMasterList);
        commentobj.GuidlineEvaluationId = SearchAssignFinalValuesInList(commentrow[i].GuidelineEvaluation,DropDownSchema.GuidelineEvaluationList);
        commentobj.SchedulingStaffMessageId = SearchAssignFinalValuesInList(commentrow[i].SchedulingStaffMsg,DropDownSchema.SchedulingStaffMessageList);
        commentobj.ProtocolEvaluationId = SearchAssignFinalValuesInList(commentrow[i].ProtocolEvaluation,DropDownSchema.ProtocolEvaluationList);
        commentobj.RefillAmountId = SearchAssignFinalValuesInList(commentrow[i].RefillAmount,DropDownSchema.RefillAmountList);
        commentobj.RoutingDispositionId = SearchAssignFinalValuesInList(commentrow[i].RoutingDisposition,DropDownSchema.RoutingDispositionList);
        commentobj.RemovedId = SearchAssignFinalValuesInList(commentrow[i].Removed,DropDownSchema.ReportsRemovedList);
        commentobj.ReconTabId = SearchAssignFinalValuesInList(commentrow[i].ReconTab,DropDownSchema.ReconResultList);
        
        commentobj.IsDynamicComment = 0;
        if (commentrow[i].CommentText.includes("{{") &&commentrow[i].CommentText.includes("}}")) 
        {commentobj.IsDynamicComment = 1;}
        commentobj.IsActive = false;
        if (commentrow[i].IsActive.toString().trim().toLowerCase() == 'yes') {commentobj.IsActive = true;}
        let _CreatedBy = __session.Get("userid");
        commentobj.CreatedBy = parseInt(_CreatedBy);
        commentobj.ModifiedBy = parseInt(_CreatedBy);
        if (IsValidEntries(commentrow[i]) == false) {
          url = getApiUrl("UploadUpdateCommentDataToDb");
          await UploadComment(url, commentobj);
        } else {
          url = getApiUrl("UploadInsertCommentDataToDb");
          await UploadComment(url, commentobj);
        }
      }
      
    }
  }
}

// Method to upload comment data to database
async function UploadComment(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ClientName: __session.Get('clientname'),
      Authorization: `Bearer ${AuthService.FetchToken()}`
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  } else {
    var res = await response.json()
    console.log(res)


    if (res > 0) {
      successToastr('MastersAlert', 'CommentUploadInsert/Update Success')
    } else {
      //-----------------------------//
     
      $('#mainDivId').show()
      //-----------------------------//
      errorToastr('MastersAlert', 'CommentUploadInsert/Update Failed')
    }
  }
}


// check duplicate entries in db
function IsValidEntries(roai) {
  var validationFlag = true;
  var roacode = roai.Code;
  for (var j in commentList) {
    if (roacode.toString().trim().toLowerCase() == commentList[j].Code.toString().trim().toLowerCase()) {
      validationFlag = false;
      break;
    }
  }
  return validationFlag;
}

function checkDuplicateCodesInExcel(roa) {
  var duplicatecodecheck = false;
  for (var i = 0; i < roa.length - 1; i++) {
    for (var k = i + 1; k < roa.length; k++) {
      if (
        roa[k].Code.toString().trim().toLowerCase() == roa[i].Code.toString().trim().toLowerCase()
      ) {
        duplicatecodecheck = true;
        break;
      }
    }
  }
  return duplicatecodecheck;
}

// function to assign invalid values in List
function SearchAssignInvalidValuesInList(str, strArray) {
  for (var i = 0; i < strArray.length; i++) {
    if (strArray[i].Text.toString().toLowerCase().trim() == str.toString().toLowerCase()) {
      return strArray[i].Text;
    }
  }
    return -10;
}

function SearchAssignInvalidCommentCategoryValuesInList(str, strArray) {
  for (var i = 0; i < strArray.length; i++) {
    if (strArray[i].Name.toString().toLowerCase().trim() == str.toString().toLowerCase()) {
      return strArray[i].Name;
    }
  }
    return -10;
}

function SearchAssignFinalValuesInList(str, strArray) {
  for (var i = 0; i < strArray.length; i++) {
    if (strArray[i].Text.toString().toLowerCase().trim() == str.toString().toLowerCase()) {
      return strArray[i].Id;
    }
  }
}

function SearchAssignFinalCommentCategoryValuesInList(str, strArray) {
  for (var i = 0; i < strArray.length; i++) {
    if (strArray[i].Name.toString().toLowerCase().trim() == str.toString().toLowerCase()) {
      return strArray[i].Id;
    }
  }
}

function IsActiveInvalidFlag(str) {
  if (str.toString().toLowerCase() == "yes") {
    return str.toString().trim();
  } else if (str.toString().toLowerCase() == "no") {
    return str.toString().trim();
  } else {
    return -10;
  }
}

function getDifference(setA, setB) {
  return new Set([...setA].filter((element) => !setB.has(element)));
}

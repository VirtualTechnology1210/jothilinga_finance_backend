const express = require("express");
// const addMemberWithFamilyDetails = require("../controllers/addMemberWithFamilyDetails");
const getMemberAndFamilyDetailsById = require("../controllers/getMemberAndFamilyDetailsById");
const addMemberWithFamilyBusinessDetails = require("../controllers/addMemberWithFamilyBusinessDetails");
const addBusinessCategory = require("../controllers/addBusinessCategory");
const getAllBusinessCategories = require("../controllers/getAllBusinessCategories");
const addNatureOfBusiness = require("../controllers/addNatureOfBusiness");
const getNatureOfBusinessByBusinessCategoryId = require("../controllers/getNatureOfBusinessByBusinessCategoryId");
const addProposedLoanDetails = require("../controllers/addProposedLoanDetails");
const addLoanDetails = require("../controllers/addLoanDetails");
const addBankDetails = require("../controllers/addBankDetails.");
const getMemberFormDetails = require("../controllers/getMemberFormDetails");
const getStatusList = require("../controllers/getStatusList");
const addBranch = require("../controllers/addBranch");
const getAllBranches = require("../controllers/getAllBranches");
const updateBranch = require("../controllers/updateBranch");
const addFieldManagerCredentials = require("../controllers/addFieldManagerCredentials");
const addManagerCredentials = require("../controllers/addManagerCredentials");
const getBranchManagers = require("../controllers/getBranchManagers");
const updateBranchManagerCredentials = require("../controllers/updateBranchManagerCredentials");
const updateMemberDetailsWithCreditOfficerUpdatedAt = require("../controllers/updateMemberDetailsWithCreditOfficerUpdatedAt");
const updateFamilyDetails = require("../controllers/updateFamilyDetails");
const updateMemberBusinessDetails = require("../controllers/updateMemberBusinessDetails");
const updateFamilyBusinessDetails = require("../controllers/updateFamilyBusinessDetails");
const loginSuperAdmin = require("../controllers/loginSuperAdmin");
const addFamilyDetails = require("../controllers/addFamilyDetails");
const addFamilyBusinessDetails = require("../controllers/addFamilyBusinessDetails");
const updateLoanDetails = require("../controllers/updateLoanDetails");
const updateProposedLoanDetails = require("../controllers/updateProposedLoanDetails");
const updateBankDetails = require("../controllers/updateBankDetails");
const getMemberDetailsByCreditManagerIdAndStatus = require("../controllers/getMemberDetailsByCreditManagerIdAndStatus");
const getMemberPhotosById = require("../controllers/getMemberPhotosById");
const uploadMemberPhotos = require("../controllers/uploadMemberPhotos");
const getNomineePhotosById = require("../controllers/getNomineePhotosById");
const uploadNomineePhotos = require("../controllers/uploadNomineePhotos");
const getAccountsManagers = require("../controllers/getAccountsManagers");
const getCreditManagers = require("../controllers/getCreditManagers");
const getFieldManagers = require("../controllers/getFieldManagers");
const updateFieldManagerCredentials = require("../controllers/updateFieldManagerCredentials");
const uploadCreditManagerDocuments = require("../controllers/uploadCreditManagerDocuments");
const getCreditDocumentsById = require("../controllers/getCreditDocumentsById");
const addPaymentsReceipts = require("../controllers/addPaymentsReceipts");
const getPaymentsReceiptsByFieldManagerId = require("../controllers/getPaymentsReceiptsByFieldManagerId");
const getAllMemberDetails = require("../controllers/getAllMemberDetails");
const getAllMemberDetailsByManagerUsernameAndStatus = require("../controllers/getAllMemberDetailsByManagerUsernameAndStatus");
const getUserLoginsCount = require("../controllers/getUserLoginsCount");
const getMemberIdExistenceInModels = require("../controllers/getMemberIdExistenceInModels");
const loginManager = require("../controllers/loginManager");
const addMemberDetails = require("../controllers/addMemberDetails");
const updateMemberDetails = require("../controllers/updateMemberDetails");
const addCreditAnalysis = require("../controllers/addCreditAnalysis");
const uploadCibilPdf = require("../controllers/uploadCibilPdf");
const updateMemberDetailsWithCreditManagerStatusUpdatedAt = require("../controllers/updateMemberDetailsWithCreditManagerStatusUpdatedAt");
const getMemberDetailsByBranchManagerIdAndStatus = require("../controllers/getMemberDetailsByBranchManagerIdAndStatus");
const getAllMemberDetailsByAccountManagerIdAndStatus = require("../controllers/getAllMemberDetailsByAccountManagerIdAndStatus");
const getBankDetailsByMemberId = require("../controllers/getBankDetailsByMemberId");
const updateBankDetailsByMemberId = require("../controllers/updateBankDetailsByMemberId");
const getCreditOfficers = require("../controllers/getCreditOfficers");
const getAllMemberDetailsByCreditOfficerIdAndStatus = require("../controllers/getAllMemberDetailsByCreditOfficerIdAndStatus");
const getCreditAnalysisById = require("../controllers/getCreditAnalysisById");
const getMemberDetailsForSuperadminAndAccountManagerStatus = require("../controllers/getMemberDetailsForSuperadminAndAccountManagerStatus");
const getMIS = require("../controllers/getMIS");
const updateMISCredentials = require("../controllers/updateMISCredentials");
const getSanctionCommittee = require("../controllers/getSanctionCommittee");
const updateSanctionCommitteeCredentials = require("../controllers/updateSanctionCommitteeCredentials");
const updateMemberDetailsByMemberId = require("../controllers/updateMemberDetailsByMemberId");
const updateFamilyDetailsByMemberId = require("../controllers/updateFamilyDetailsByMemberId");
const updateBusinessDetailsByMemberId = require("../controllers/updateBusinessDetailsByMemberId");
const updateLoanDetailsByMemberId = require("../controllers/updateLoanDetailsByMemberId");
const updateProposedLoanDetailsByMemberId = require("../controllers/updateProposedLoanDetailsByMemberId");
const uploadBranchManagerVerificationPhotos = require("../controllers/uploadBranchManagerVerificationPhotos");
const delBranchManagerVerificationDocument = require("../controllers/delBranchManagerVerificationDocument");
const getMemberDetailsByFieldManager = require("../controllers/getMemberDetailsByFieldManager");
const getMemberDetailsByBranchManager = require("../controllers/getMemberDetailsByBranchManager");
const uploadCreditOfficerVerificationPhotos = require("../controllers/uploadCreditOfficerVerificationPhotos");
const delCreditOfficerVerificationDocument = require("../controllers/delCreditOfficerVerificationDocument");
const getMemberDetailsByCreditOfficer = require("../controllers/getMemberDetailsByCreditOfficer");
const getMemberDetailsByMis = require("../controllers/getMemberDetailsByMis");
const getMemberDetailsByCreditManager = require("../controllers/getMemberDetailsByCreditManager");
const getMemberDetailsBySanctionCommittee = require("../controllers/getMemberDetailsBySanctionCommittee");
const getMemberDetailsByAccountsManager = require("../controllers/getMemberDetailsByAccountsManager");
const getMemberDetailsBySuperadmin = require("../controllers/getMemberDetailsBySuperadmin");
const addCreditAnalysisWithCreditOfficerVsMisStatus = require("../controllers/addCreditAnalysisWithCreditOfficerVsMisStatus");
const addCreditOfficerVerificationData = require("../controllers/addCreditOfficerVerificationData");
const uploadCbReport = require("../controllers/uploadCbReport");
const delCreditOfficerVerificationData = require("../controllers/delCreditOfficerVerificationData");
const uploadBranchManagerVerificationPhotosStatic = require("../controllers/uploadBranchManagerVerificationPhotosStatic");
const uploadCreditOfficerVerificationPhotosStatic = require("../controllers/uploadCreditOfficerVerificationPhotosStatic");
const getVerificationPhotosById = require("../controllers/getVerificationPhotosById");
const searchMembersByInput = require("../controllers/searchMembersByInput");
const getFutureDemandReportData = require("../controllers/getFutureDemandReportData");
const getEmiPendingList = require("../controllers/getEmiPendingList");
const addReceipt = require("../controllers/addReceipt");
const getLoanDisbursementData = require("../controllers/getLoanDisbursementData");
const getMasterReportData = require("../controllers/getMasterReportData");
const getClientProspectReportData = require("../controllers/getClientProspectReportData");
const getOutstandingReportData = require("../controllers/getOutstandingReportData");
const getAllDivisions = require("../controllers/getAllDivisions");
const getAllRegions = require("../controllers/getAllRegions");
const addDivision = require("../controllers/addDivision");
const updateDivision = require("../controllers/updateDivision");
const addRegion = require("../controllers/addRegion");
const updateRegion = require("../controllers/updateRegion");
const getDashboardCount = require("../controllers/getDashboardCount");
const getCollectionReportData = require("../controllers/getCollectionReportData");
const getDemandVsCollectionReportData = require("../controllers/getDemandVsCollectionReportData");
const delMember = require("../controllers/delMember");
const getRejectReportData = require("../controllers/getRejectReportData");
const getAccountStatementReport = require("../controllers/getAccountStatementReport");
const getInsurancePendingList = require("../controllers/getInsurancePendingList");
const addInsuranceReceipt = require("../controllers/addInsuranceReceipt");
const getPermissionsMatrix = require("../controllers/getPermissionsMatrix");
const updatePermissionForRole = require("../controllers/updatePermissionForRole");
const getInsuranceReportData = require("../controllers/getInsuranceReportData");
const getCroData = require("../controllers/getCroData");
const transferCro = require("../controllers/transferCro");
const getModelData = require("../controllers/getModelData");
const addDetails = require("../controllers/addDetails");
const addDetailsWithImages = require("../controllers/addDetailsWithImages");
const delDetails = require("../controllers/delDetails");
const searchByInput = require("../controllers/searchByInput");
const addCgtWithImages = require("../controllers/addCgtWithImages");
const getCentersByManager = require("../controllers/getCentersByManager");
const updateMeetingDetailsByBm = require("../controllers/updateMeetingDetailsByBm");
const updateGenerateDocumentDetails = require("../controllers/updateGenerateDocumentDetails");
const approveAccountManagerJlg = require("../controllers/approveAccountManagerJlg");
const getJlgInsuranceReportData = require("../controllers/getJlgInsuranceReportData");
const updateCenterTimes = require("../controllers/updateCenterTimes");
const getMembersForEuc = require("../controllers/getMembersForEuc");
const getJlgEmiPendingList = require("../controllers/getJlgEmiPendingList");
const updateJlgEmiPayWithImage = require("../controllers/updateJlgEmiPayWithImage");
const getCrosByManagerId = require("../controllers/getCrosByManagerId");
const getJlgEmiPendingApprovals = require("../controllers/getJlgEmiPendingApprovals");
const getBranchesByManagerId = require("../controllers/getBranchesByManagerId");
const addReceiptWithImage = require("../controllers/addReceiptWithImage");
const updateReceiptWithImage = require("../controllers/updateReceiptWithImage");
const getBlEmiPendingApprovals = require("../controllers/getBlEmiPendingApprovals");
const getJlgFutureDemandReportData = require("../controllers/getJlgFutureDemandReportData");
const getJlgLoanDisbursementData = require("../controllers/getJlgLoanDisbursementData");
const getJlgMasterReportData = require("../controllers/getJlgMasterReportData");
const getJlgClientProspectReportData = require("../controllers/getJlgClientProspectReportData");
const getJlgOutstandingReportData = require("../controllers/getJlgOutstandingReportData");
const getJlgCollectionReportData = require("../controllers/getJlgCollectionReportData");
const getJlgDemandVsCollectionReportData = require("../controllers/getJlgDemandVsCollectionReportData");
const getJlgRejectReportData = require("../controllers/getJlgRejectReportData");
const getJlgCollectionSheetReport = require("../controllers/getJlgCollectionSheetReport");
const getForeclosureDataForBm = require("../controllers/getForeclosureDataForBm");
const foreclosureSubmit = require("../controllers/foreclosureSubmit");
const getNocDataForAm = require("../controllers/getNocDataForAm");
const getForeclosureReportData = require("../controllers/getForeclosureReportData");
const getEucReportData = require("../controllers/getEucReportData");
const getCroTransferByCenterWiseReportData = require("../controllers/getCroTransferByCenterWiseReportData");
const getCroTransferByMemberWiseReportData = require("../controllers/getCroTransferByMemberWiseReportData");
const getProcessingFeeSummaryReportData = require("../controllers/getProcessingFeeSummaryReportData");
const getJlgProcessingFeeSummaryReportData = require("../controllers/getJlgProcessingFeeSummaryReportData");
const addOrEditDetails = require("../controllers/addOrEditDetails");
const uploadBranchManagerBookingProcessDocuments = require("../controllers/uploadBranchManagerBookingProcessDocuments");
const {getByMemberId} = require("../controllers/emi_chart_controller");
const {createEmiChart} = require("../controllers/emi_chart_controller");



//new Route



const router = express.Router();




//new route

router.post("/createemichart", createEmiChart);
router.get("/getemichartbymemberId/:memberId", getByMemberId);

router.post("/member-details", addMemberDetails);
router.post("/coapplicant-details", addFamilyDetails);
router.get("/members/:memberId", getMemberAndFamilyDetailsById);
router.post("/business-details", addMemberWithFamilyBusinessDetails);
router.post("/business-categories", addBusinessCategory);
router.get("/business-categories", getAllBusinessCategories);
router.post("/nature-of-business", addNatureOfBusiness);
router.get(
  "/nature-of-business/:categoryId",
  getNatureOfBusinessByBusinessCategoryId
);
router.post("/addProposedLoanDetails", addProposedLoanDetails);
router.post("/member/loan/details/:memberId", addLoanDetails);
router.post("/addBankDetails", addBankDetails);
router.get("/loan/formDetails/:memberId", getMemberFormDetails);
router.get("/get/statusList/:id", getStatusList);
router.post("/manager/login", loginManager);
router.post("/create/branch", addBranch);
router.get("/getall/branches", getAllBranches);
router.put("/admin/editbranch", updateBranch);
router.post("/add/fieldmanager", addFieldManagerCredentials);
router.post("/add/credential", addManagerCredentials);
router.get("/branch/managers", getBranchManagers);
router.put("/branch/managers/:id", updateBranchManagerCredentials);
router.put(
  "/creditmanager/memberdetail/update",
  updateMemberDetailsWithCreditOfficerUpdatedAt
);
router.put("/manager/message", updateMemberDetails);
router.put("/creditmanager/familydetails/update", updateFamilyDetails);
router.put(
  "/creditmanager/applicantBusiness/edit",
  updateMemberBusinessDetails
);
router.put("/creditmanager/familyBusiness/edit", updateFamilyBusinessDetails);
router.post("/superadmin/login", loginSuperAdmin);
router.post("/creditmanager/familydetails/add", addFamilyDetails);
router.post("/creditmanager/familyBusiness/add", addFamilyBusinessDetails);
router.put("/creditmanager/loandetail/edit", updateLoanDetails);
router.put(
  "/creditmanager/proposed/loandetail/edit",
  updateProposedLoanDetails
);
router.put("/creditmanager/bankdetails/edit", updateBankDetails);
router.get(
  "/getmemberdetails/ByCreditManagerId",
  getMemberDetailsByCreditManagerIdAndStatus
);
router.get("/field/manager/memberphotos/:memberId", getMemberPhotosById);
router.post("/memberdocument/upload", uploadMemberPhotos);
router.get("/field/manager/nomineephotos/:memberId", getNomineePhotosById);
router.post("/nomineedocument/upload", uploadNomineePhotos);
router.get("/accounts/managers", getAccountsManagers);
router.put("/accounts/managers/:id", updateBranchManagerCredentials);
router.get("/credit/managers", getCreditManagers);
router.put("/credit/managers/:id", updateBranchManagerCredentials);
router.get("/field/managers", getFieldManagers);
router.put("/field/managers/:id", updateFieldManagerCredentials);
router.post("/creditmanager/uploadeddocuments", uploadCreditManagerDocuments);
router.get("/creditdocuments/:memberId", getCreditDocumentsById);
router.post("/fieldmanager/receipt/payments", addPaymentsReceipts);
router.get(
  "/:fieldManagerId/receipt/payments",
  getPaymentsReceiptsByFieldManagerId
);
router.get("/superadmin/memberdetails", getAllMemberDetails);
router.get(
  "/manager/memberdetails/:username",
  getAllMemberDetailsByManagerUsernameAndStatus
);
router.get("/login/count", getUserLoginsCount);
router.get("/pending/details/:memberId", getMemberIdExistenceInModels);
router.post("/creditOfficer/status", addCreditAnalysis);
router.post("/credit/pdf", uploadCibilPdf);
router.put(
  "/creditmanager/status/:memberId",
  updateMemberDetailsWithCreditManagerStatusUpdatedAt
);
router.get(
  "/getmemberdetails/ByBranchManagerId",
  getMemberDetailsByBranchManagerIdAndStatus
);
router.get(
  "/getmemberdetails/ByAccountManagerId",
  getAllMemberDetailsByAccountManagerIdAndStatus
);
router.get("/getBankDetails/:memberId", getBankDetailsByMemberId);
// router.put("/editBankDetails/:memberId", updateBankDetailsByMemberId);
router.get("/credit/officers", getCreditOfficers);
router.put("/credit/officers/:id", updateBranchManagerCredentials);
router.get(
  "/getmemberdetails/ByCreditOfficerId",
  getAllMemberDetailsByCreditOfficerIdAndStatus
);
router.get("/creditofficer/analysis/:memberId", getCreditAnalysisById);
router.get(
  "/getmemberdetails/superadmin",
  getMemberDetailsForSuperadminAndAccountManagerStatus
);
router.get("/mis/managers", getMIS);
router.put("/mis/managers/:id", updateMISCredentials);
router.get("/sanctionCommittee/managers", getSanctionCommittee);
router.put(
  "/sanctionCommittee/managers/:id",
  updateSanctionCommitteeCredentials
);
router.put("/updateMemberDetailsByMemberId", updateMemberDetailsByMemberId);
router.put("/updateFamilyDetailsByMemberId", updateFamilyDetailsByMemberId);
router.put("/updateBusinessDetailsByMemberId", updateBusinessDetailsByMemberId);
router.put("/updateLoanDetailsByMemberId", updateLoanDetailsByMemberId);
router.put(
  "/updateProposedLoanDetailsByMemberId",
  updateProposedLoanDetailsByMemberId
);
router.put("/updateBankDetailsByMemberId", updateBankDetailsByMemberId);
router.post(
  "/branchmanager/uploadeddocuments",
  uploadBranchManagerVerificationPhotos
);
router.post(
  "/delBranchManagerVerificationDocument",
  delBranchManagerVerificationDocument
);
router.get("/getMemberDetailsByFieldManager", getMemberDetailsByFieldManager);
router.get("/getMemberDetailsByBranchManager", getMemberDetailsByBranchManager);
router.post(
  "/creditOfficer/uploadeddocuments",
  uploadCreditOfficerVerificationPhotos
);
router.post(
  "/delCreditOfficerVerificationDocument",
  delCreditOfficerVerificationDocument
);
router.get("/getMemberDetailsByCreditOfficer", getMemberDetailsByCreditOfficer);
router.get("/getMemberDetailsByMis", getMemberDetailsByMis);
router.get("/getMemberDetailsByCreditManager", getMemberDetailsByCreditManager);
router.get(
  "/getMemberDetailsBySanctionCommittee",
  getMemberDetailsBySanctionCommittee
);
router.get(
  "/getMemberDetailsByAccountsManager",
  getMemberDetailsByAccountsManager
);
router.get("/getMemberDetailsBySuperadmin", getMemberDetailsBySuperadmin);
router.post(
  "/addCreditAnalysisWithCreditOfficerVsMisStatus",
  addCreditAnalysisWithCreditOfficerVsMisStatus
);
router.post(
  "/addCreditOfficerVerificationData",
  addCreditOfficerVerificationData
);
router.post("/uploadCbReport", uploadCbReport);
router.post(
  "/delCreditOfficerVerificationData",
  delCreditOfficerVerificationData
);
router.post(
  "/uploadBranchManagerVerificationPhotosStatic",
  uploadBranchManagerVerificationPhotosStatic
);
router.post(
  "/uploadCreditOfficerVerificationPhotosStatic",
  uploadCreditOfficerVerificationPhotosStatic
);
router.get(
  "/getVerificationPhotosById/:memberId/:role",
  getVerificationPhotosById
);
router.post("/searchMembersByInput", searchMembersByInput);
router.get("/getFutureDemandReportData", getFutureDemandReportData);
router.get("/getEmiPendingList", getEmiPendingList);
router.post("/addReceipt", addReceipt);
router.get("/getLoanDisbursementData", getLoanDisbursementData);
router.get("/getMasterReportData", getMasterReportData);
router.get("/getClientProspectReportData", getClientProspectReportData);
router.get("/getOutstandingReportData", getOutstandingReportData);
router.get("/getall/divisions", getAllDivisions);
router.get("/getall/regions", getAllRegions);
router.post("/create/division", addDivision);
router.put("/admin/editdivision", updateDivision);
router.post("/create/region", addRegion);
router.put("/admin/editregion", updateRegion);
router.get("/dashboardcount", getDashboardCount);
router.get("/getCollectionReportData", getCollectionReportData);
router.get("/getDemandVsCollectionReportData", getDemandVsCollectionReportData);
router.post("/delMember", delMember);
router.get("/getRejectReportData", getRejectReportData);
router.get(
  "/getAccountStatmentReport/:applicationId",
  getAccountStatementReport
);
router.get("/getInsurancePendingList", getInsurancePendingList);
router.post("/addInsuranceReceipt", addInsuranceReceipt);
router.get("/getPermissionsMatrix", getPermissionsMatrix);
router.post("/updatePermissionForRole", updatePermissionForRole);
router.get("/getInsuranceReportData", getInsuranceReportData);
router.get("/getCroData", getCroData);
router.post("/transferCro", transferCro);
router.get("/getModelData/:modelName", getModelData);
router.post("/addDetails", addDetails);
router.post("/addDetailsWithImages", addDetailsWithImages);
router.post("/delDetails", delDetails);
router.post("/searchByInput", searchByInput);
router.post("/addCgtWithImages", addCgtWithImages);
router.get("/getCentersByManager", getCentersByManager);
router.post("/updateMeetingDetailsByBm", updateMeetingDetailsByBm);
router.post("/updateGenerateDocumentDetails", updateGenerateDocumentDetails);
router.post("/approveAccountManagerJlg", approveAccountManagerJlg);
router.get("/getJlgInsuranceReportData", getJlgInsuranceReportData);
router.post("/updateCenterTimes", updateCenterTimes);
router.get("/getMembersForEuc", getMembersForEuc);
router.get("/getJlgEmiPendingList", getJlgEmiPendingList);
router.post("/updateJlgEmiPayWithImage", updateJlgEmiPayWithImage);
router.get("/getCrosByManagerId", getCrosByManagerId);
router.get("/getJlgEmiPendingApprovals", getJlgEmiPendingApprovals);
router.get("/getBranchesByManagerId", getBranchesByManagerId);
router.post("/addReceiptWithImage", addReceiptWithImage);
router.post("/updateReceiptWithImage", updateReceiptWithImage);
router.get("/getBlEmiPendingApprovals", getBlEmiPendingApprovals);
router.get("/getJlgFutureDemandReportData", getJlgFutureDemandReportData);
router.get("/getJlgLoanDisbursementData", getJlgLoanDisbursementData);
router.get("/getJlgMasterReportData", getJlgMasterReportData);
router.get("/getJlgClientProspectReportData", getJlgClientProspectReportData);
router.get("/getJlgOutstandingReportData", getJlgOutstandingReportData);
router.get("/getJlgCollectionReportData", getJlgCollectionReportData);
router.get(
  "/getJlgDemandVsCollectionReportData",
  getJlgDemandVsCollectionReportData
);
router.get("/getJlgRejectReportData", getJlgRejectReportData);
router.get("/getJlgCollectionSheetReport", getJlgCollectionSheetReport);
router.get("/getForeclosureDataForBm", getForeclosureDataForBm);
router.post("/foreclosureSubmit", foreclosureSubmit);
router.get("/getNocDataForAm", getNocDataForAm);
router.get("/getForeclosureReportData", getForeclosureReportData);
router.get("/getEucReportData", getEucReportData);
router.get(
  "/getCroTransferByCenterWiseReportData",
  getCroTransferByCenterWiseReportData
);
router.get(
  "/getCroTransferByMemberWiseReportData",
  getCroTransferByMemberWiseReportData
);
router.get(
  "/getProcessingFeeSummaryReportData",
  getProcessingFeeSummaryReportData
);
router.get(
  "/getJlgProcessingFeeSummaryReportData",
  getJlgProcessingFeeSummaryReportData
);
router.post("/addOrEditDetails", addOrEditDetails);
router.post(
  "/uploadBranchManagerBookingProcessDocuments",
  uploadBranchManagerBookingProcessDocuments
);
// Add more routes as needed

module.exports = router;

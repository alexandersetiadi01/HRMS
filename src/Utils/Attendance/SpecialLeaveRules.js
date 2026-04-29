const SPECIAL_LEAVE_RULES = {
  marriage: [
    "1.結婚者給予婚假八日，工資照給",
    "2.請檢附結婚登記證",
  ],

  funeral: [
    "勞工喪假規定：",
    "一、父母、養父母、繼父母、配偶喪亡者，給予喪假8日，工資照給。",
    "二、祖父母、子女、配偶之父母、配偶之養父母或繼父母喪亡者，給予喪假6日，工資照給。",
    "三、曾祖父母、兄弟姊妹、配偶之祖父母喪亡者，給予喪假3日，工資照給。",
  ],

  familyCare: [
    "1.於其家庭成員預防接種、發生嚴重之疾病或其他重大事故須親自照顧時，得請家庭照顧假；其請假日數併入事假計算，全年以7日為限",
    "2.請檢附證明文件",
  ],

  maternityCheckup: [
    "1.陪產檢及陪產假共計七日。員工於其配偶妊娠產檢或其配偶分娩時，給予陪產檢及陪產假；如員工係為陪伴配偶產檢，應於配偶妊娠期間請休，如員工係為陪伴配偶生產，應在配偶分娩的當日及其前後合計15日期間內請休。",
    "2.請檢附出生證明文件。",
  ],

  publicLeave: [
    "1.員工依法令規定應給予公假者，工資照給",
    "2.請檢附證明文件",
  ],

  injuryLeave: [
    "1.員工因職業災害而致殘廢、傷害或疾病者，其治療、休養期間，給予公傷病假",
    "2.需檢附公傷證明文件",
  ],

  unpaidSick: [
    "1.員工因普通傷害、疾病或生理原因必須治療或休養者。",
    "2.病假期間不給工資",
  ],
};

export function getSpecialLeaveRuleKey(leaveName) {
  const name = String(leaveName || "");

  if (name.includes("婚")) return "marriage";
  if (name.includes("喪")) return "funeral";
  if (name.includes("家庭照顧")) return "familyCare";
  if (name.includes("陪產")) return "maternityCheckup";
  if (name.includes("公傷")) return "injuryLeave";
  if (name.includes("公假")) return "publicLeave";
  if (name.includes("無薪病假")) return "unpaidSick";

  return "";
}

export function getSpecialLeaveRules(leaveName) {
  const key = getSpecialLeaveRuleKey(leaveName);

  if (!key) {
    return [];
  }

  return SPECIAL_LEAVE_RULES[key] || [];
}

export default SPECIAL_LEAVE_RULES;
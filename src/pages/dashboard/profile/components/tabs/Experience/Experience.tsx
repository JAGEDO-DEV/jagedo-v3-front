// @ts-nocheck
import FundiExperience from "./FundiExperience";
import ProfessionalExperience from "./ProfessionalExperience";
import ContractorExperience from "./ContractorExperience";

const Experience = (props: any) => {
  const userType = props?.userData?.userType || "FUNDI";
  switch (userType) {
    case "FUNDI":
      return <FundiExperience {...props} />;
    case "CONTRACTOR":
      return <ContractorExperience {...props} />;
    case "PROFESSIONAL":
    case "HARDWARE":
      return <ProfessionalExperience {...props} />;
    default:
      return <FundiExperience {...props} />;
  }
};

export default Experience;

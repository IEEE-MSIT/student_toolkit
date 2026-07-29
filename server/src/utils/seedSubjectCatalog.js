import SubjectCatalog from "../models/SubjectCatalog.js";
import { subjectCatalogSeed } from "../data/subjectCatalog.js";

const seedSubjectCatalog = async () => {
  const existingCount = await SubjectCatalog.countDocuments();

  if (existingCount > 0) {
    return;
  }

  await SubjectCatalog.insertMany(subjectCatalogSeed);
  console.log(`Seeded ${subjectCatalogSeed.length} subjects into the catalog`);
};

export default seedSubjectCatalog;

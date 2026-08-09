const express = require("express");
const router = express.Router();

// Mock FHIR R4 Patient generator endpoint
router.get("/Patient/:id", async (req, res) => {
  const { id } = req.params;
  res.json({
    resourceType: "Patient",
    id: id,
    meta: { versionId: "1", lastUpdated: new Date().toISOString() },
    text: { status: "generated", div: "<div>Jioplix FHIR Resource</div>" },
    identifier: [{ system: "https://jioplix.com/mrn", value: `MRN-${id}` }],
    active: true,
    name: [{ use: "official", family: "Doe", given: ["John"] }],
    gender: "male",
    birthDate: "1985-04-12"
  });
});

// Mock FHIR R4 Bundle compiler
router.get("/Bundle/:id", async (req, res) => {
  const { id } = req.params;
  res.json({
    resourceType: "Bundle",
    id: id,
    type: "document",
    timestamp: new Date().toISOString(),
    entry: [
      { resource: { resourceType: "Composition", title: "Discharge Summary", status: "final" } },
      { resource: { resourceType: "Patient", id: id } }
    ]
  });
});

module.exports = router;

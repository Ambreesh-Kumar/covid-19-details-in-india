const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
app.use(express.json());
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (err) {
    console.log(`DB Error: ${err.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const getPascalCase = (eachValue) => {
  return {
    stateId: eachValue.state_id,
    stateName: eachValue.state_name,
    population: eachValue.population,
  };
};

const getPascalCaseDistrict = (district) => {
  return {
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    active: district.active,
    deaths: district.deaths,
  };
};

// get states

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT 
        *
    FROM 
        state;
    `;
  const stateList = await db.all(getStatesQuery);
  response.send(stateList.map((eachValue) => getPascalCase(eachValue)));
});

//get state as per ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateAsStateId = `
    SELECT 
        *
    FROM 
        state 
    WHERE
        state_id = ${stateId}; 
    `;
  const state = await db.get(getStateAsStateId);
  response.send(getPascalCase(state));
});

// add district

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
  INSERT INTO 
    district 
    (district_name, state_id, cases, cured, active, deaths)
  VALUES 
    (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );
    `;
  const district = await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

// get district

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictAsDistrictId = `
    SELECT 
        *
    FROM 
        district
    WHERE
        district_id = ${districtId}; 
    `;
  const district = await db.get(getDistrictAsDistrictId);
  response.send(getPascalCaseDistrict(district));
});

// delete district

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM
        district
    WHERE
        district_id = ${districtId};
    `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// update district

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const districtUpdateQuery = `
  UPDATE 
    district 
  SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    active = ${active},
    deaths = ${deaths};
  `;
  await db.run(districtUpdateQuery);
  response.send("District Details Updated");
});

// get case details

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getCasesQuery = `
    SELECT 
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
    FROM 
        district 
    WHERE 
        state_id = ${stateId};
    `;
  const cases = await db.get(getCasesQuery);
  response.send({
    totalCases: cases["SUM(cases)"],
    totalCured: cases["SUM(cured)"],
    totalActive: cases["SUM(active)"],
    totalDeaths: cases["SUM(deaths)"],
  });
});

//get state districtDetails

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateIdQuery = `
  SELECT 
    state_id
  FROM
    district
  WHERE 
    district_id = ${districtId};
  `;
  const stateIdResponse = await db.get(getStateIdQuery);
  const getStateDetailsAsDistrictId = `
    SELECT 
        state_name as stateName
    FROM 
        state
    WHERE
        state_id = ${stateIdResponse.state_id}; 
    `;
  const stateDetails = await db.get(getStateDetailsAsDistrictId);
  response.send(stateDetails);
});

module.exports = app;

const getJoins = () => `JOIN 
    kv_cameras cam ON cam.id = kes.camera_id
JOIN
    kv_computers com ON com.id = cam.computer_id
JOIN
    kv_crossroads cros ON cros.id = com.crossroad_id 
JOIN 
    kv_rules kr ON kr.id = (kes.args->>'rules')::int`;


const getWhere = (params) => {
    let where = `WHERE the_date BETWEEN '${params.from_date}' AND '${params.to_date}'`;

    // params.car_number (if more than one should be ', OR |' separated), can contain '_' and/or '*'

    if (params.qoida_buzarlik) where += " AND (kes.args->>'rules')::int > 0";
    if (params.is_passive) where += " AND (kes.respond->>'cause') = 'passive'";
    if (params.is_active) where += " AND kes.args->'edited'->>'by' IS NOT NULL AND kes.respond->>'cause' IS NULL";

    if (params.car_number) {
        let carNumber = params.car_number.toString().toUpperCase();

        carNumber = carNumber.split('*').join('%');
        carNumber = carNumber.split(',').join('|');
        where += ` AND car_number SIMILAR TO '%(${carNumber})%'`;
    }

    if (params.camera_id) where += ` AND cam.id IN (${params.camera_id})`;

    if (params.computer_id) where += ` AND com.id IN (${params.computer_id})`;

    if (params.crossroads_id) where += ` AND cros.id IN (${params.crossroads_id})`;

    if (params.rules) {
        where += ` AND kr.id IN (${params.rules})`;
    }

    if (params.models) where += ` AND kes.args->'car'->>'model' IN ('${params.models.join("','")}')`;

    if (params.colors) where += ` AND kes.args->'car'->>'color' IN ('${params.colors.join("','")}')`;

    if (params.countries) where += ` AND kes.args->>'country' IN ('${params.countries.join("','")}')`;
    return where;
};

const getWhereAuto = (params) => {
    let where = `WHERE the_date BETWEEN '${params.from_date}' AND '${params.to_date}'`;
    
    if (params.qoida_buzarlik) where += " AND (kes.args->>'rules')::int > 0";
    
    if (params.car_number) {
        console.log(params.car_number);
        let carNumber = params.car_number.toString().toUpperCase();
        
        console.log(carNumber);
        

        carNumber = carNumber.split('*').join('%');
        carNumber = carNumber.split(',').join('|');
        console.log(carNumber);
        where += ` AND car_number SIMILAR TO '%(${carNumber})%'`;
    }
    
    if (params.object_id) {
        where += ` AND cros.id IN (${ params.object_id.join(",")})`
    }
    
    return where;
}

const getFilter = (filter) => (filter ?
    ` AND (
      UPPER(kes.args->'car'->>'color') SIMILAR TO UPPER('${filter}') OR
      UPPER(kes.args->'car'->>'model') SIMILAR TO UPPER('${filter}') OR
      UPPER(kes.args->>'country') SIMILAR TO UPPER('${filter}')
  )` :
    '');
    
module.exports = { getJoins, getWhere, getWhereAuto, getFilter }
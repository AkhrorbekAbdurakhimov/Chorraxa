const { database } = require('./connection')
const { getJoins, getWhere, getWhereAuto, getFilter } = require('./query')

class Chorraxa {
    static async getChorraxas() {
        const sql = `
            SELECT 
                cros.id, cros.title, coordinates, COUNT(ev.id)::integer
            FROM
                kv_crossroads cros
            JOIN
                kv_computers com ON cros.id = com.crossroad_id
            JOIN
                kv_cameras cam ON cam.computer_id = com.id
            JOIN
                kv_events ev ON ev.camera_id = cam.id AND ev.the_date > 'today'
            WHERE
                coordinates is not null
            GROUP BY
                cros.id, cros.title
            ORDER BY 
                count DESC
        `;
        const result = await database.query(sql);
        return result.rows || [];
    }
    
    static async listChorraxas() {
        const result = await database.query('SELECT id, title from kv_crossroads')
        return result.rows || [];
    }

    static async listRules() {
        const result = await database.query(
            [
                'SELECT id AS key, title AS name, sync_code, get_code',
                'FROM kv_rules ORDER BY id ASC'
            ].join(' '),
        );
        return result.rows || [];
    }

    static async listCrossroads() {
        const result = await database.query(
            [
                'SELECT kc.id AS key, kc.title AS name, kc.ip_address,',
                'kg.title AS g_name, kc.group_id',
                'FROM kv_crossroads kc',
                'JOIN kv_groups kg ON kc.group_id = kg.id',
                'ORDER BY kc.ip_address ASC;',
            ].join(' '),
        );
        return result.rows || [];
    }

    static async countPenaltiesByCategory(from, to) {
        const sql = `
            SELECT 
                kr.id, kr.title, COUNT(kes.id)
            FROM 
                kv_events_sent kes
            JOIN
                kv_rules kr ON kr.id::text = kes.args->>'rules'
            WHERE 
                the_date BETWEEN $1 AND $2 AND args->>'rules' != '0'
            GROUP BY kr.id, kr.title;`;

        const result = await database.query(sql, [from, to]);
        return result.rows || [];
    }

    static async getComputers(crossroadId) {
        const result = await database.query(
            [
                'SELECT kc.id AS key, kc.title AS name, crossroad_id, cros.title AS c_name',
                'FROM kv_computers kc',
                'JOIN kv_crossroads cros ON kc.crossroad_id = cros.id',
                `WHERE crossroad_id IN (${crossroadId})`,
                'ORDER BY cros.title ASC',
            ].join(' '),
        );
        return result.rows || [];
    }

    static async getCameras(computerId) {
        const result = await database.query(
            `SELECT id AS key, title AS name FROM kv_cameras WHERE computer_id IN (${computerId}) ORDER BY title ASC`,
        );
        return result.rows || [];
    }

    static async search(options) {
        const result = await database.query(
            [
                "SELECT kes.id AS key, car_number, to_char(the_date, 'YYYY-MM-DD HH24:MI:SS') AS the_date,",
                'the_date::text AS urlpart, camera_id,  cam.title AS camera, kr.title AS rules,',
                "COALESCE(kes.args->'car'->>'color', 'Бошқа') AS color,",
                "COALESCE(kes.args->'car'->>'model', 'Бошқа') AS model,",
                "COALESCE(kes.args->>'country', 'Бошқа') country",
                'FROM kv_events kes',
                getJoins(),
                getWhere(options),
                getFilter(options.filter),
                'ORDER BY the_date DESC LIMIT $1',
                'OFFSET $2;',
            ].join(' '),
            [options.limit, options.offset],
        );
        return result.rows || [];
    }
    
    static async autoSearch(options) {
        const result = await database.query(
            [
                "SELECT car_number, to_char(the_date, 'YYYY-MM-DD HH24:MI:SS') AS the_date,",
                "kr.title AS rules, CONCAT('http://', CAST($1 AS VARCHAR), '/foreign/chorraxa/image?c_id=', kes.camera_id, '&p_id=1&t=all&highlightCarNumber=false&c=photos&p=car', '&d=', kes.the_date) as event_photo,",
                "CONCAT('http://', CAST($1 AS VARCHAR), '/foreign/chorraxa/image?c_id=', kes.camera_id, '&p_id=1&t=all&highlightCarNumber=false&crop=false&c=photos&p=car', '&d=', kes.the_date) as main_photo,",
                "cros.title as object_title, 'chorraxa' as type, cros.coordinates as coordinates",
                'FROM kv_events kes',
                getJoins(),
                getWhereAuto(options),
            ].join(' '), [options.host]
        );
        
        result.rows.map(el => {
            el.event_photo = el.event_photo.split('&d=')[0] + "&d=" + encodeURIComponent(el.event_photo.split('&d=')[1])
            el.main_photo = el.main_photo.split('&d=')[0] + "&d=" + encodeURIComponent(el.main_photo.split('&d=')[1])
        })
        return result.rows || [];
    }
    
    static async count(options) {
        const result = await database.query(
            [
                'SELECT COUNT(kes.id) AS total,',
                "ARRAY_AGG(DISTINCT COALESCE(kes.args->'car'->>'color','Бошқа')) colors,",
                "ARRAY_AGG(DISTINCT COALESCE(kes.args->'car'->>'model','Бошқа')) models,",
                "ARRAY_AGG(DISTINCT COALESCE(kes.args->>'country', 'Бошқа')) countries ",
                'FROM kv_events kes',
                getJoins(),
                getWhere(options),
            ].join(' '),
        );
        return result.rows || [];
    }

    static async getImage(cameraId, theDate) {
        const result = await database.query('SELECT photos[1] FROM kv_events WHERE camera_id = $1 AND the_date = $2',
            [cameraId, theDate]
        );
        return result.rows || [];
    }
    
    static async getLastEvent(previousTheDate, host) {
        try {
            const sql = `
            SELECT camera_id, the_date::varchar, cros.coordinates, CONCAT('http://', CAST($2 AS VARCHAR), '/foreign/chorraxa/image?c_id=', camera_id, '&p_id=1&t=all&c=photos&p=car', '&d=', the_date) as event_photo
            FROM
                kv_events e
            JOIN
                kv_cameras cam ON cam.id = e.camera_id
            JOIN
                kv_computers com ON com.id = cam.computer_id
            JOIN
                kv_crossroads cros ON cros.id = com.crossroad_id
            WHERE 
                the_date > $1 AND cros.coordinates is not null
            ORDER BY
                the_date ASC
            LIMIT 
                5`;
            const result = await database.query(sql, [previousTheDate, host]);
            result.rows.map(el => {
                el.event_photo = el.event_photo.split('&d=')[0] + "&d=" + encodeURIComponent(el.event_photo.split('&d=')[1])
            })
            return result.rows || [];
        } catch (error) {
            return [];
        }
    }
}

module.exports = Chorraxa
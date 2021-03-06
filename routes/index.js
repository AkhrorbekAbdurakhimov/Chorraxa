const router = require('express').Router();
const proxy = require('express-http-proxy');
const url = require("url");
const { catchReject } = require('./../utils/helper')
const { computers, cameras, autoSearchSchema, search, getPhoto } = require('./schema')
const Chorraxa = require('./../database')

const getPosts = catchReject(async (req, res) => {
    const result = await Chorraxa.getChorraxas();
    return res.send({
        data: result
    })
})

const getChorraxas = catchReject(async (req, res) => {
    const result = await Chorraxa.listChorraxas();
    return res.send({
        data: result
    })
})

const getRules = catchReject(async (req, res) => {
    const results = await Chorraxa.listRules();
    if (results.length > 0) {
        return res.send({
            data: results,
        });
    }
    return res.sendStatus(404);
});

const getCrossroads = catchReject(async (req, res) => {
    const results = await Chorraxa.listCrossroads();
    return res.send({
        data: results,
    });
});

const getComputers = catchReject(async (req, res) => {
    const { error, value } = computers.validate(req.query);
    if (error) {
        return res.send({
            status: 400,
            message: 'Bad request',
            error: error.details[0].message,
        });
    }
    const results = await Chorraxa.getComputers(value.crossroad_id); 
    return res.send({
        data: results,
    });
});

const getCameras = catchReject(async (req, res) => {
    const { error, value } = cameras.validate(req.query);
    if (error) {
        return res.send({
            status: 400,
            message: 'Bad request',
            error: error.details[0].message,
        });
    }
    const results = await Chorraxa.getCameras(value.computer_id); 
    return res.send({
        data: results,
    });
});

const searchEvent = catchReject(async (req, res) => {
    const { error, value } = search.validate(req.query);
    if (error) {
        return res.send({
            status: 400,
            message: 'Bad request',
            error: error.details[0].message,
        });
    }
    const results = await Chorraxa.search(value);
    const count = await Chorraxa.count(value);
    return res.send({
        status: 200,
        data: results,
        props: {
            total: count[0] ? count[0].total : -1,
            colors: count[0] ? count[0].colors : [],
            models: count[0] ? count[0].models : [],
            countries: count[0] ? count[0].countries : [],
        },
    });
});

const autoSearchEvent = catchReject(async (req, res) => {
    let fromDate = req.body.from_date.split(' ')
    let toDate = req.body.to_date.split(' ')
    let host = req.headers['x-host'] ? req.headers['x-host'] + ':8080'  : '192.168.2.68:8080'
    
    req.body.from_date = fromDate[0].split('.')[2] + '-' + fromDate[0].split('.')[1] + '-' + fromDate[0].split('.')[0] + ' ' + fromDate[1]
    req.body.to_date = toDate[0].split('.')[2] + '-' + toDate[0].split('.')[1] + '-' + toDate[0].split('.')[0] + ' ' + toDate[1]
    
    const { error, value } = autoSearchSchema.validate(req.body);
    value.host = host
    
    if (error) {
        return res.send({
            status: 400,
            message: 'Bad request',
            error: error.details[0].message,
        });
    }
    
    const results = await Chorraxa.autoSearch(value);
    return res.send({
        status: 200,
        data: results,
    });
})

const getLastEvent = catchReject(async (req, res, next) => {
    let host = req.headers['x-host'] ? req.headers['x-host'] + ':8080'  : '192.168.2.68:8080'
    if (!req.query.the_date) {
      return next({
        status: 400,
        message: 'Bad request!',
      });
    }
    const { the_date: theDate } = req.query;
    console.log(req.query);
    
    const results = await Chorraxa.getLastEvent(theDate, host);
    console.log(results);  
    return res.send({
        data: results,
    });
});

const countPenalties = catchReject(async (req, res, next) => {
    const { from, to } = req.query;
    let sum = 0;
    
    const result = await Chorraxa.countPenaltiesByCategory(from, to);
    
    result.map(r => sum += parseInt(r.count))
    return res.send({
        result, sum
    });
  })


router.use(
    '/image',
    proxy('http://101.4.3.2:443', {
      proxyReqPathResolver: (req) => "/image" +  url.format(req.url, req.body),
      proxyReqOptDecorator: (proxyReqOpt, srcReq) => {
        if (srcReq.headers['x-host']) {
          proxyReqOpt.headers['x-host'] = srcReq.headers['x-host'];
        }
        return proxyReqOpt;
      },
      proxyErrorHandler: (err, res, next) => {
        switch (err && err.code) {
          case 'ECONNREFUSED': {
            return res.status(502).send('Client is not online!');
          }
          default: {
            return next(err);
          }
        }
      },
    }),
  );

router.get('/', getPosts)
router.get('/chorraxas/', getChorraxas)
router.get('/penalty', countPenalties)
router.get('/rules/', getRules)
router.get('/crossroads/', getCrossroads)
router.get('/computers/', getComputers)
router.get('/cameras/', getCameras);
router.get('/search/', searchEvent);
router.post('/auto-search', autoSearchEvent);
router.get('/last-event/', getLastEvent);

module.exports = router;

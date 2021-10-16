const errorMessageHandler = (status, message = null) => {
    switch (status) {
        case 401:
            return {
                type: 'AuthenticationError',
                    message: {
                        en: 'You are unauthorized, try refreshing the page.',
                    },
            };
        case 400:
            return {
                type: 'ValidationError',
                    message: {
                        en: `Invalid Parameters: ${message}`,
                    },
            };

        case 403:
            return {
                type: 'PermissionDeniedError',
                    message: {
                        en: `Message: ${message}`,
                    },
            };
        case 405:
            return {
                type: 'PermissionNeeded',
                    message: {
                        en: `Message: ${message}`,
                    },
            };
        case 406:
            return {
                type: 'DataExists',
                    message: {
                        en: `Message: ${message}`,
                    },
            };
        case 500:
            return {
                type: 'ServerError',
                    message: {
                        en: 'Internal server error',
                    },
                    error: message,
            };
        case 404:
            return {
                type: 'NotFound',
                    error: message,
            };
        default:
            return {
                type: 'ServerError',
                    message: {
                        en: 'Internal server error',
                    },
                    error: message,
            };
    }
};

const catchReject = (func) => async (req, res, next) => {
    try {
        await func(req, res, next);
        if (res.headersSent) {
            return null;
        }
        return next();
    } catch (error) {
        return next(error);
    }
};

module.exports = { catchReject, errorMessageHandler }
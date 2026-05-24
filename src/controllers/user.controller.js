import {asyncHandler} from '../utils/asyncHandler.js';

const  registerUser = asyncHandler(async (req, res) => {

    res.status(200).json({
        message: 'ok' //res.status is used to set the HTTP status code of the response, and json is used to send a JSON response to the client. In this case, it sends a JSON object with a message property set to 'ok'.

    })
})
export {registerUser}
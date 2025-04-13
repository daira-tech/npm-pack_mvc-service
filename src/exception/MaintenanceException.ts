export default class MaintenanceException extends Error {

    constructor(message: string = "") {
        super(message);
    }
}
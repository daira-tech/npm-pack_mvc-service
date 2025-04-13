export default class InputErrorException extends Error {
    
    private errorId: string = "";
    get ErrorId(): string {
        return this.errorId;
    }

    private errorLog: string = "";
    get ErrorLog(): string {
        return this.errorLog;
    }

    constructor(errorId: string, message: string = "", errorLog: string = "") {
        super(message);
        this.errorId = errorId;
        this.errorLog = errorLog;
    }
}
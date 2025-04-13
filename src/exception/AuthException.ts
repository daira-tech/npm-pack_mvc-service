export default class AuthException extends Error {

    private id: string = "";
    get Id(): string {
        return this.id;
    }

    constructor(id: string, message: string = "") {
        super(message);
        this.id = id;
    }
}
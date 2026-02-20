export { };

declare global {
    interface Window {
        SpeechRecognition: unknown;
        webkitSpeechRecognition: unknown;
    }
}

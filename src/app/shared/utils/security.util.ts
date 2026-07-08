export class SecurityHelper {
    /**
     * Sanitizes a string by escaping HTML characters to prevent basic XSS and SQLi at the frontend layer.
     */
    static sanitizeString(value: string): string {
        if (!value) return value;
        
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Deep sanitizes an entire payload object recursively.
     * Leaves numbers, booleans, and nulls intact.
     */
    static sanitizePayload(payload: any): any {
        if (payload === null || payload === undefined) {
            return payload;
        }

        if (typeof payload === 'string') {
            return this.sanitizeString(payload);
        }

        if (Array.isArray(payload)) {
            return payload.map(item => this.sanitizePayload(item));
        }

        if (typeof payload === 'object') {
            const sanitizedObject: any = {};
            
            for (const key of Object.keys(payload)) {
                sanitizedObject[key] = this.sanitizePayload(payload[key]);
            }
            
            return sanitizedObject;
        }

        return payload;
    }

    /**
     * Validates that all required fields in the payload are present and not empty/whitespace.
     * Returns true if all fields are valid, false otherwise.
     */
    static validateRequired(payload: any, requiredFields: string[]): boolean {
        if (!payload) return false;

        for (const field of requiredFields) {
            const value = payload[field];
            
            if (value === null || value === undefined) {
                return false;
            }
            
            if (typeof value === 'string' && value.trim() === '') {
                return false;
            }
        }
        
        return true;
    }
}

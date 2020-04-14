export const contactsSchema = {
    type: 'object',
    patternProperties: {
        '^0x[0-9a-fA-F]{40}$': { type: 'string' },
    },
    additionalProperties: false,
};

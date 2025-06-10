$(document).ready(function() {
    // Keypad button click handler
    $('.keypad-btn').on('click', function() {
        const value = $(this).text().trim();
        const input = $('#phoneInput');
        const currentValue = input.val();
        
        // Handle special cases
        if (value === '+') {
            // If there's already a plus, don't add another
            if (!currentValue.startsWith('+')) {
                input.val('+' + currentValue);
            }
            return;
        }
        
        // Add the digit
        let newValue = currentValue + value;
        input.val(newValue);
        
        // Trigger input event to format the number
        input.trigger('input');
    });

    // Format phone number input
    $('#phoneInput').on('input', function() {
        const value = $(this).val();
        const formattedValue = formatPhoneNumber(value);
        $(this).val(formattedValue);
    });

    // Function to format phone number
    function formatPhoneNumber(value) {
        // Keep the plus if it exists
        const hasPlus = value.startsWith('+');
        const digits = value.replace(/\D/g, '');
        
        if (hasPlus) {
            // Handle international numbers
            if (digits.length <= 3) {
                return '+' + digits;
            } else if (digits.length <= 6) {
                return '+' + digits.slice(0, 3) + ' ' + digits.slice(3);
            } else if (digits.length <= 10) {
                return '+' + digits.slice(0, 3) + ' ' + digits.slice(3, 6) + ' ' + digits.slice(6);
            } else {
                const countryCode = digits.slice(0, -10);
                const number = digits.slice(-10);
                return '+' + countryCode + ' (' + number.slice(0, 3) + ') ' + number.slice(3, 6) + '-' + number.slice(6);
            }
        } else {
            // Handle US numbers without country code
            if (digits.length <= 3) {
                return digits;
            } else if (digits.length <= 6) {
                return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
            } else if (digits.length <= 10) {
                return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
            } else {
                // If more than 10 digits without +, assume it's a US number with country code
                return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
            }
        }
    }
}); 
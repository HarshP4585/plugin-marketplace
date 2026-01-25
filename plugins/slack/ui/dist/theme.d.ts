/**
 * VerifyWise Plugin Theme
 *
 * Shared design tokens and styles for plugin UI consistency
 * This matches the main VerifyWise application theme
 */
export declare const colors: {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    secondary: string;
    secondaryHover: string;
    success: string;
    successHover: string;
    successLight: string;
    warning: string;
    warningHover: string;
    warningLight: string;
    error: string;
    errorHover: string;
    errorLight: string;
    info: string;
    infoHover: string;
    infoLight: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    textDisabled: string;
    background: string;
    backgroundSecondary: string;
    backgroundHover: string;
    border: string;
    borderLight: string;
    white: string;
    disabled: string;
};
export declare const typography: {
    fontFamily: string;
    sizes: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        xxl: string;
    };
    weights: {
        regular: number;
        medium: number;
        semibold: number;
        bold: number;
    };
    lineHeights: {
        tight: number;
        normal: number;
        relaxed: number;
    };
};
export declare const spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
};
export declare const borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
};
export declare const shadows: {
    none: string;
    sm: string;
    md: string;
    lg: string;
};
export declare const buttonStyles: {
    base: {
        borderRadius: string;
        fontWeight: number;
        fontSize: string;
        textTransform: "none";
        boxShadow: string;
        transition: string;
        cursor: string;
        display: string;
        alignItems: string;
        justifyContent: string;
        gap: string;
    };
    sizes: {
        small: {
            height: string;
            padding: string;
            fontSize: string;
        };
        medium: {
            height: string;
            padding: string;
            fontSize: string;
        };
        large: {
            height: string;
            padding: string;
            fontSize: string;
        };
    };
    primary: {
        contained: {
            backgroundColor: string;
            color: string;
            border: string;
            "&:hover": {
                backgroundColor: string;
            };
            "&:disabled": {
                backgroundColor: string;
                color: string;
                cursor: string;
            };
        };
        outlined: {
            backgroundColor: string;
            color: string;
            border: string;
            "&:hover": {
                backgroundColor: string;
                borderColor: string;
            };
            "&:disabled": {
                borderColor: string;
                color: string;
                cursor: string;
            };
        };
        text: {
            backgroundColor: string;
            color: string;
            border: string;
            "&:hover": {
                backgroundColor: string;
            };
            "&:disabled": {
                color: string;
                cursor: string;
            };
        };
    };
    secondary: {
        contained: {
            backgroundColor: string;
            color: string;
            border: string;
            "&:hover": {
                backgroundColor: string;
            };
        };
        outlined: {
            backgroundColor: string;
            color: string;
            border: string;
            "&:hover": {
                backgroundColor: string;
                borderColor: string;
            };
        };
    };
    error: {
        contained: {
            backgroundColor: string;
            color: string;
            border: string;
            "&:hover": {
                backgroundColor: string;
            };
        };
        outlined: {
            backgroundColor: string;
            color: string;
            border: string;
            "&:hover": {
                backgroundColor: string;
                borderColor: string;
            };
        };
    };
};
export declare const inputStyles: {
    base: {
        borderRadius: string;
        border: string;
        backgroundColor: string;
        fontSize: string;
        padding: string;
        transition: string;
        "&:hover": {
            borderColor: string;
        };
        "&:focus": {
            borderColor: string;
            outline: string;
            boxShadow: string;
        };
        "&:disabled": {
            backgroundColor: string;
            color: string;
            cursor: string;
        };
    };
    label: {
        fontSize: string;
        fontWeight: number;
        color: string;
        marginBottom: string;
    };
    helperText: {
        fontSize: string;
        color: string;
        marginTop: string;
    };
    errorText: {
        fontSize: string;
        color: string;
        marginTop: string;
    };
};
export declare const cardStyles: {
    base: {
        backgroundColor: string;
        borderRadius: string;
        border: string;
        padding: string;
    };
    elevated: {
        backgroundColor: string;
        borderRadius: string;
        boxShadow: string;
        padding: string;
    };
};
export declare const tableStyles: {
    header: {
        backgroundColor: string;
        fontWeight: number;
        fontSize: string;
        color: string;
        textTransform: "uppercase";
        padding: string;
    };
    cell: {
        fontSize: string;
        color: string;
        padding: string;
        borderBottom: string;
    };
    row: {
        "&:hover": {
            backgroundColor: string;
        };
    };
};
export declare const alertStyles: {
    success: {
        backgroundColor: string;
        borderColor: string;
        color: string;
    };
    warning: {
        backgroundColor: string;
        borderColor: string;
        color: string;
    };
    error: {
        backgroundColor: string;
        borderColor: string;
        color: string;
    };
    info: {
        backgroundColor: string;
        borderColor: string;
        color: string;
    };
};
export declare const chipStyles: {
    base: {
        borderRadius: string;
        fontSize: string;
        fontWeight: number;
        padding: string;
        display: string;
        alignItems: string;
    };
    success: {
        backgroundColor: string;
        color: string;
    };
    warning: {
        backgroundColor: string;
        color: string;
    };
    error: {
        backgroundColor: string;
        color: string;
    };
    info: {
        backgroundColor: string;
        color: string;
    };
    neutral: {
        backgroundColor: string;
        color: string;
    };
};
export declare const modalStyles: {
    overlay: {
        backgroundColor: string;
        zIndex: number;
    };
    content: {
        backgroundColor: string;
        borderRadius: string;
        boxShadow: string;
        maxWidth: string;
        width: string;
        maxHeight: string;
        overflow: string;
    };
    header: {
        padding: string;
        borderBottom: string;
    };
    body: {
        padding: string;
    };
    footer: {
        padding: string;
        borderTop: string;
        display: string;
        justifyContent: string;
        gap: string;
    };
    title: {
        fontSize: string;
        fontWeight: number;
        color: string;
        margin: number;
    };
};
declare const theme: {
    colors: {
        primary: string;
        primaryHover: string;
        primaryLight: string;
        secondary: string;
        secondaryHover: string;
        success: string;
        successHover: string;
        successLight: string;
        warning: string;
        warningHover: string;
        warningLight: string;
        error: string;
        errorHover: string;
        errorLight: string;
        info: string;
        infoHover: string;
        infoLight: string;
        textPrimary: string;
        textSecondary: string;
        textTertiary: string;
        textDisabled: string;
        background: string;
        backgroundSecondary: string;
        backgroundHover: string;
        border: string;
        borderLight: string;
        white: string;
        disabled: string;
    };
    typography: {
        fontFamily: string;
        sizes: {
            xs: string;
            sm: string;
            md: string;
            lg: string;
            xl: string;
            xxl: string;
        };
        weights: {
            regular: number;
            medium: number;
            semibold: number;
            bold: number;
        };
        lineHeights: {
            tight: number;
            normal: number;
            relaxed: number;
        };
    };
    spacing: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        xxl: string;
    };
    borderRadius: {
        sm: string;
        md: string;
        lg: string;
        full: string;
    };
    shadows: {
        none: string;
        sm: string;
        md: string;
        lg: string;
    };
    buttonStyles: {
        base: {
            borderRadius: string;
            fontWeight: number;
            fontSize: string;
            textTransform: "none";
            boxShadow: string;
            transition: string;
            cursor: string;
            display: string;
            alignItems: string;
            justifyContent: string;
            gap: string;
        };
        sizes: {
            small: {
                height: string;
                padding: string;
                fontSize: string;
            };
            medium: {
                height: string;
                padding: string;
                fontSize: string;
            };
            large: {
                height: string;
                padding: string;
                fontSize: string;
            };
        };
        primary: {
            contained: {
                backgroundColor: string;
                color: string;
                border: string;
                "&:hover": {
                    backgroundColor: string;
                };
                "&:disabled": {
                    backgroundColor: string;
                    color: string;
                    cursor: string;
                };
            };
            outlined: {
                backgroundColor: string;
                color: string;
                border: string;
                "&:hover": {
                    backgroundColor: string;
                    borderColor: string;
                };
                "&:disabled": {
                    borderColor: string;
                    color: string;
                    cursor: string;
                };
            };
            text: {
                backgroundColor: string;
                color: string;
                border: string;
                "&:hover": {
                    backgroundColor: string;
                };
                "&:disabled": {
                    color: string;
                    cursor: string;
                };
            };
        };
        secondary: {
            contained: {
                backgroundColor: string;
                color: string;
                border: string;
                "&:hover": {
                    backgroundColor: string;
                };
            };
            outlined: {
                backgroundColor: string;
                color: string;
                border: string;
                "&:hover": {
                    backgroundColor: string;
                    borderColor: string;
                };
            };
        };
        error: {
            contained: {
                backgroundColor: string;
                color: string;
                border: string;
                "&:hover": {
                    backgroundColor: string;
                };
            };
            outlined: {
                backgroundColor: string;
                color: string;
                border: string;
                "&:hover": {
                    backgroundColor: string;
                    borderColor: string;
                };
            };
        };
    };
    inputStyles: {
        base: {
            borderRadius: string;
            border: string;
            backgroundColor: string;
            fontSize: string;
            padding: string;
            transition: string;
            "&:hover": {
                borderColor: string;
            };
            "&:focus": {
                borderColor: string;
                outline: string;
                boxShadow: string;
            };
            "&:disabled": {
                backgroundColor: string;
                color: string;
                cursor: string;
            };
        };
        label: {
            fontSize: string;
            fontWeight: number;
            color: string;
            marginBottom: string;
        };
        helperText: {
            fontSize: string;
            color: string;
            marginTop: string;
        };
        errorText: {
            fontSize: string;
            color: string;
            marginTop: string;
        };
    };
    cardStyles: {
        base: {
            backgroundColor: string;
            borderRadius: string;
            border: string;
            padding: string;
        };
        elevated: {
            backgroundColor: string;
            borderRadius: string;
            boxShadow: string;
            padding: string;
        };
    };
    tableStyles: {
        header: {
            backgroundColor: string;
            fontWeight: number;
            fontSize: string;
            color: string;
            textTransform: "uppercase";
            padding: string;
        };
        cell: {
            fontSize: string;
            color: string;
            padding: string;
            borderBottom: string;
        };
        row: {
            "&:hover": {
                backgroundColor: string;
            };
        };
    };
    alertStyles: {
        success: {
            backgroundColor: string;
            borderColor: string;
            color: string;
        };
        warning: {
            backgroundColor: string;
            borderColor: string;
            color: string;
        };
        error: {
            backgroundColor: string;
            borderColor: string;
            color: string;
        };
        info: {
            backgroundColor: string;
            borderColor: string;
            color: string;
        };
    };
    chipStyles: {
        base: {
            borderRadius: string;
            fontSize: string;
            fontWeight: number;
            padding: string;
            display: string;
            alignItems: string;
        };
        success: {
            backgroundColor: string;
            color: string;
        };
        warning: {
            backgroundColor: string;
            color: string;
        };
        error: {
            backgroundColor: string;
            color: string;
        };
        info: {
            backgroundColor: string;
            color: string;
        };
        neutral: {
            backgroundColor: string;
            color: string;
        };
    };
    modalStyles: {
        overlay: {
            backgroundColor: string;
            zIndex: number;
        };
        content: {
            backgroundColor: string;
            borderRadius: string;
            boxShadow: string;
            maxWidth: string;
            width: string;
            maxHeight: string;
            overflow: string;
        };
        header: {
            padding: string;
            borderBottom: string;
        };
        body: {
            padding: string;
        };
        footer: {
            padding: string;
            borderTop: string;
            display: string;
            justifyContent: string;
            gap: string;
        };
        title: {
            fontSize: string;
            fontWeight: number;
            color: string;
            margin: number;
        };
    };
};
export default theme;

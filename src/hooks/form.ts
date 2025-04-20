import { createFormHook } from "@tanstack/react-form";

import {
	OTPInput,
	PasswordField,
	Select,
	SubscribeButton,
	TextArea,
	TextField,
} from "../components/FormComponents";
import { fieldContext, formContext } from "./form-context";

export const { useAppForm } = createFormHook({
	fieldComponents: {
		TextField,
		Select,
		TextArea,
		PasswordField,
		OTPInput,
	},
	formComponents: {
		SubscribeButton,
	},
	fieldContext,
	formContext,
});

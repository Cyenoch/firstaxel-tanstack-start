import { createFormHook } from "@tanstack/react-form";

import {
	OTPInput,
	PasswordField,
	Select,
	SubscribeButton,
	TextArea,
	TextField,
} from "../components/demo.FormComponents";
import { fieldContext, formContext } from "./demo.form-context";

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

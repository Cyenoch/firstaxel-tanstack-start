const QRCodeGenerator = ({
	qrCode,
}: {
	qrCode: string;
}) => {
	return (
		<div
			style={{
				width: "200px",
				height: "200px",
			}}
			className=" rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: used for QR code generator server-side
			dangerouslySetInnerHTML={{
				__html: qrCode,
			}}
		/>
	);
};

export default QRCodeGenerator;

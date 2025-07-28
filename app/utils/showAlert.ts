import { Alert, Platform } from "react-native";

const IS_WEB = Platform.OS === 'web';

export function showAlert(title: string, message: string) {
	if (IS_WEB) {
		window.alert(message)
	} else {
		Alert.alert(
			title,
			message
		);
	}
}

export function showAlertWithButtons(title: string, message: string, confirmCallback: Function) {	
	if (IS_WEB) {
		if(window.confirm(message)){
			confirmCallback()
		}
	} else {
		Alert.alert(title, 
			message, 
			[
				{ text: 'Cancel', style: 'cancel' },
				{ 
					text: 'Confirm', 
					style: 'destructive',
					onPress: () => confirmCallback()
				}
			]
		)
	}
}


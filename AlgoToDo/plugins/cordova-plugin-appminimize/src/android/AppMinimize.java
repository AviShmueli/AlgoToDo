package tomloprod;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import android.content.Intent;

public class AppMinimize extends CordovaPlugin {

    @Override
    public boolean execute(String action, JSONArray data, CallbackContext callbackContext) throws JSONException {
        
		if (action.equals("minimize")) {
		    Intent startMain = new Intent(Intent.ACTION_MAIN);
			startMain.addCategory(Intent.CATEGORY_HOME);
			startMain.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
			this.cordova.getActivity().startActivity(startMain);
			// try : this.cordova.getActivity().finishActivity() for going back to prev activity
			callbackContext.success(1);
        }
		
        
		return false;
        
    }
}

package org.bootsfaces.theme;

import java.io.Serializable;

import javax.faces.bean.ManagedBean;
import javax.faces.bean.SessionScoped;

@ManagedBean(name="theme")
@SessionScoped
public class Theme 
implements Serializable {
	private static final long serialVersionUID = -3503081656623751490L;

	private String currentTheme = "blue"; //"default";
	private String internalTheme = "custom"; //"default";
	private String customTheme = "blue";

	public String getCurrentTheme() {
		return currentTheme;
	}
	public String getInternalTheme() {
		return internalTheme;
	}
	public void setCustomTheme(String theme) {
		this.customTheme = theme;
	}
	public String getCustomTheme() {
		if (customTheme == null || customTheme.isEmpty()) customTheme = "blue";
		return customTheme;
	}

	public void setCurrentTheme(String currentTheme) {
		this.internalTheme = "other";
		this.currentTheme = currentTheme;
		this.customTheme = currentTheme;
	}

	public void selectTheme() {
	}
}

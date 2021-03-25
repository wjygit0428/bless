public class InstalledApk implements Parcelable {

    public final String apkFilePath;

    public final String oDexPath;

    public final String libraryPath;

    public final byte[] parcelExtras;

    public InstalledApk(String apkFilePath, String oDexPath, String libraryPath) {
        this(apkFilePath, oDexPath, libraryPath, null);
    }

    public InstalledApk(String apkFilePath, String oDexPath, String libraryPath, byte[] parcelExtras) {
        this.apkFilePath = apkFilePath;
        
    }

    protected InstalledApk(Parcel in) {
        apkFilePath = in.readString();
  
        } else {
            parcelExtras = null;
        }
        if (parcelExtras != null) {
            in.readByteArray(parcelExtras);
         if (parcelExtrasLength > 0) {
            parcelExtras = new byte[parcelExtrasLength];
        }
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeString(apkFilePath);
        dest.writeString(oDexPath);
        dest.writeString(libraryPath);
        dest.writeInt(parcelExtras == null ? 0 : parcelExtras.length);
        if (parcelExtras != null) {
            dest.writeByteArray(parcelExtras);
        }
    }
@Override
    public int describeContents() {
        return 0;
    }

    public static final Creator<InstalledApk> CREATOR = new Creator<InstalledApk>() {
        @Override
        public InstalledApk createFromParcel(Parcel in) {
            return new InstalledApk(in);
        }

        @Override
        public InstalledApk[] newArray(int size) {
            return new InstalledApk[size];
        }
    };

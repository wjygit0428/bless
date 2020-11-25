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
        this.oDexPath = oDexPath;
        this.libraryPath = libraryPath;
        this.parcelExtras = parcelExtras;
    }

    protected InstalledApk(Parcel in) {
        apkFilePath = in.readString();
        oDexPath = in.readString();
        libraryPath = in.readString();
        int parcelExtrasLength = in.readInt();
        if (parcelExtrasLength > 0) {
            parcelExtras = new byte[parcelExtrasLength];
        } else {
            parcelExtras = null;
        }
        if (parcelExtras != null) {
            in.readByteArray(parcelExtras);
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

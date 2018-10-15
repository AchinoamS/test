<%@ WebHandler Language="C#" Class="handler_simulated" %>


using System;
using System.Net;
using System.Linq;
using System.Web;
using System.Drawing;
using System.IO;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Xml;
using System.Data;
using SqlJsonDal;

public class handler_simulated : IHttpHandler {

    const string _cookieName = "schkip-token";
    const int Insert = 6;
    const int Update = 2;
    const int Delete = 8;

    //Guid sessionKey = Guid.Empty;
    public void ProcessRequest(HttpContext context)
    {
        string sAction = context.Request.QueryString["Action"];
        context.Response.CacheControl = "no-cache";
        context.Response.ContentType = "application/json";

        try
        {
            if (sAction == "login")
            {
                handleLogin(context);
            }
            else if (sAction == "resetPSW")
            {
                context.Response.WriteFile(context.Server.MapPath("api/") + "resetPSW.json");
            }
            else if (sAction == "generalEntity")
            {
                handleEntityAction(context);
            }
            else
            {
                handleHTTPAction(context, sAction);
            }
        }
        catch (Exception ex)
        {
            generateHTTPError(context, ex.Message);
        }
    }


    private bool isEntitySimulated(string entityType)
    {
        switch (entityType)
        {
            case "login": return true;
            case "userInfo": return true;
            case "appMeta": return true;
            default:
                return true;

        }
        return false;
    }



    private void handleHTTPAction(HttpContext context, string sAction)
    {
        if (!validateSession(context)) return;
        dynamic postData = JsonConvert.DeserializeObject<dynamic>(getPostStringData(context));
        Guid sessionKey = new Guid(HttpUtility.UrlDecode(context.Request.Cookies.Get(_cookieName).Value).Replace("\"", string.Empty));

        string sPath = context.Server.MapPath("api/");
        string fileName = null;
        string json = null;

        switch (sAction)
        {
            case "userInfo":
                if (!isEntitySimulated("userInfo"))
                {
                    object ojson = (SqlJson.execSPRetScalar("stp_general",
                        SqlJson.makeParam("@sessionKey", SqlDbType.NVarChar, sessionKey.ToString()),
                        SqlJson.makeParam("@action", SqlDbType.NVarChar, "getUserInfo"))
                    );
                    json = ojson.ToString();
                }
                else
                {
                    fileName = "app_login.json";
                }
                break;
            case "appMeta":
                if (!isEntitySimulated("app_meta"))
                {
                    object ojson = (SqlJson.execSPRetScalar("stp_general",
                        SqlJson.makeParam("@sessionKey", SqlDbType.NVarChar, sessionKey.ToString()),
                        SqlJson.makeParam("@action", SqlDbType.NVarChar, "getPurchaseMetadata"))
                    );
                    json = ojson.ToString();
                }
                else
                {
                    fileName = "app_meta.json";
                }
                break;
            default:
                generateHTTPError(context, "Interface: \"" + sAction + "\" not supported!");
                break;
        }
        if (fileName != null)
        {
            context.Response.WriteFile(sPath + fileName);
        }
        if (json != null)
        {
            context.Response.Write(json);
        }
    }


    #region general entity methods

    private void handleEntityAction(HttpContext context)
    {

        //System.Threading.Thread.Sleep(550);// for simulation purposes
        string entityType = context.Request.QueryString["ET"];
        string requestType = context.Request.QueryString["ACT"];
        XmlDocument criteria = getPostData(context);
        Guid sessionKey = new Guid(HttpUtility.UrlDecode(context.Request.Cookies.Get(_cookieName).Value).Replace("\"", string.Empty));
        string json = null;

        if (!isEntitySimulated(entityType))
        {
            dynamic postData = JsonConvert.DeserializeObject<dynamic>(getPostStringData(context));
            object ojson = (SqlJson.execSPRetScalar("stp_entity",
                SqlJson.makeParam("@sessionKey", SqlDbType.NVarChar, sessionKey.ToString()),
                SqlJson.makeParam("@entity", SqlDbType.NVarChar, entityType),
                SqlJson.makeParam("@action", SqlDbType.NVarChar, requestType),
                SqlJson.makeParam("@jsonCreteria", SqlDbType.NVarChar, JsonConvert.SerializeObject(postData)))
            );
            json = ojson.ToString();
            context.Response.Write(json);
            return;
        }

        System.Threading.Thread.Sleep(400);
        switch (requestType)
        {
            case "rows":
                getEntityRows(context, entityType);
                break;
            case "details":
                getEntityDetails(context, entityType);
                break;
            case "save":
                saveEntity(context, entityType);
                break;
            case "delete":
                deleteEntity(context, entityType);
                return;

        }
        if (json != null)
        {
            context.Response.Write(json);
        }
    }


    /// <summary>
    /// Get entity rows simulation
    /// </summary>
    /// <param name="context"></param>
    /// <param name="entityType"></param>
    private void getEntityRows(HttpContext context, string entityType)
    {
        if (entityType == "programs_ex") entityType = "programs";
        dynamic postData = JsonConvert.DeserializeObject<dynamic>(getPostStringData(context));
        string sPath = context.Server.MapPath("api/") + "app_" + entityType + ".json";
        if (postData.SiteId != null)
        {
            string results = getStringFromFile(sPath);
            JArray jArray = (JArray)JsonConvert.DeserializeObject(results);
            context.Response.Write(JsonConvert.SerializeObject(jArray));
        }
        else
        {
            context.Response.WriteFile(sPath);
        }
    }

    /// <summary>
    /// Get entity details simulation
    /// </summary>
    /// <param name="context"></param>
    /// <param name="entityType"></param>
    private void getEntityDetails(HttpContext context, string entityType)
    {
        if (entityType == "programs_ex") entityType = "programs";
        dynamic postData = JsonConvert.DeserializeObject<dynamic>(getPostStringData(context));
        string sPath = context.Server.MapPath("api/") + "app_" + entityType + ".json";
        string results = getStringFromFile(sPath);
        JArray jArray = (JArray)JsonConvert.DeserializeObject(results);
        string itemId = postData.id.ToString();
        for (int i = jArray.Count - 1; i >= 0; i--)
        {
            var item = jArray[i];
            if (item["id"].ToString() == itemId)
            {
                context.Response.Write(JsonConvert.SerializeObject(item));
                break;
            }
        }

    }
    /// <summary>
    /// save entity row simulation
    /// </summary>
    /// <param name="context"></param>
    /// <param name="entityType"></param>
    private void saveEntity(HttpContext context, string entityType)
    {
        dynamic postData = JsonConvert.DeserializeObject<dynamic>(getPostStringData(context));

        string sPath = context.Server.MapPath("api/") + "app_" + entityType + ".json";
        string results = getStringFromFile(sPath);
        JArray jArray = (JArray)JsonConvert.DeserializeObject(results);

        if (postData.id == null)//save new
        {
            //generate unique id
            postData.id = DateTime.Now.ToOADate().ToString();
            postData.number = (jArray.Count + 1).ToString().PadLeft(4,'0');
            postData.created = DateTime.UtcNow.ToString("o");
            postData.createdBy = "Ori Schreiber";

            jArray.Add(postData);
        }
        else //save edit
        {
            for (int i = jArray.Count - 1; i >= 0; i--)
            {
                var item = jArray[i];
                if (item["id"].ToString() == postData.id.ToString())
                {
                    postData.updated = DateTime.UtcNow.ToString("o");
                    postData.updatedBy = "Moishe Schreiber";
                    item.Replace(postData);
                }
            }
        }
        System.IO.File.WriteAllText(sPath, JsonConvert.SerializeObject(jArray));
        string json = JsonConvert.SerializeObject(postData);
        context.Response.Write(json);
    }

    /// <summary>
    /// delete entity row simulation
    /// </summary>
    /// <param name="context"></param>
    /// <param name="entityType"></param>
    private void deleteEntity(HttpContext context, string entityType)
    {
        dynamic postData = JsonConvert.DeserializeObject<dynamic>(getPostStringData(context));

        string sPath = context.Server.MapPath("api/") + "app_" + entityType + ".json";
        string results = getStringFromFile(sPath);
        JArray jArray = (JArray)JsonConvert.DeserializeObject(results);

        for (int i = jArray.Count - 1; i >= 0; i--)
        {
            var item = jArray[i];
            if (item["id"].ToString() == postData.id.ToString())
            {
                item.Remove();
                break;
            }
        }
        System.IO.File.WriteAllText(sPath, JsonConvert.SerializeObject(jArray));
        context.Response.Write(JsonConvert.SerializeObject(new { success = true }));
    }


    #endregion




    private void handleLogin(HttpContext context)
    {
        dynamic postData = JsonConvert.DeserializeObject<dynamic>(getPostStringData(context));
        if (isEntitySimulated("login"))
        {
            if (true)// Simulates Success
            {
                context.Response.WriteFile(context.Server.MapPath("api/app_login.json"));
            }
            else
            {
                generateHTTPError(context, "Invalid User name / Password!", 401);
            }
        }
        else
        {

            if (System.Web.HttpContext.Current.User.Identity.IsAuthenticated)
            {
                postData.userName = System.Web.HttpContext.Current.User.Identity.Name;
            }
            else
            {
                postData.userName = Environment.UserName;
            }


            object ojson = (SqlJson.execSPRetScalar("stp_login",
                //SqlJson.makeParam("@sessionKey", SqlDbType.NVarChar, sessionKey.ToString()),
                SqlJson.makeParam("@jsonCreteria", SqlDbType.NVarChar, JsonConvert.SerializeObject(postData)))
            );
            string json = ojson.ToString();
            context.Response.Write(json);
        }
    }


    private bool validateSession(HttpContext context)
    {
        HttpCookie c = context.Request.Cookies.Get(_cookieName);
        if (c == null || String.IsNullOrEmpty(c.Value))
        {
            generateHTTPError(context, "Please login!", 401);
            return false;
        }
        return true;
    }

    private void generateHTTPError(HttpContext context, string message)
    {
        generateHTTPError(context, message, 500);
    }
    private void generateHTTPError(HttpContext context, string message, int status)
    {
        context.Response.Write(JsonConvert.SerializeObject(new { error = true, status = status, message = message }));
        context.Response.StatusCode = status;
    }


    public bool IsReusable
    {
        get
        {
            return false;
        }
    }
    private XmlDocument getPostData(HttpContext context)
    {
        System.IO.StreamReader reader = new System.IO.StreamReader(context.Request.InputStream);
        string requestFromPost = reader.ReadToEnd();
        return JsonConvert.DeserializeXmlNode(requestFromPost, "criteria");
    }
    private string getPostStringData(HttpContext context)
    {
        System.IO.StreamReader reader = new System.IO.StreamReader(context.Request.InputStream);
        reader.BaseStream.Seek(0, SeekOrigin.Begin);
        return reader.ReadToEnd();

    }

    public Image LoadImageFromBase64(string strImage)
    {
        //get a temp image from bytes, instead of loading from disk
        //data:image/gif;base64,
        //this image is a single pixel (black)
        byte[] bytes = Convert.FromBase64String(strImage);

        Image image;
        using (MemoryStream ms = new MemoryStream(bytes))
        {
            image = Image.FromStream(ms);
        }
        return image;
    }

    public dynamic getStringFromFile(string sPath){
        using (StreamReader r = new StreamReader(sPath))
        {
            return r.ReadToEnd();

        }
    }
}
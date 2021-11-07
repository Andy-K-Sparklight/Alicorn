import { Add, DeleteForever, Refresh } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Switch,
  TextField,
  ThemeProvider,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Account } from "../modules/auth/Account";
import {
  AccountType,
  copyAccount,
  getAllAccounts,
  loadAccount,
  querySkinFor,
  removeAccount,
  saveAccount,
} from "../modules/auth/AccountUtil";
import { AuthlibAccount } from "../modules/auth/AuthlibAccount";
import { MojangAccount } from "../modules/auth/MojangAccount";
import { Nide8Account } from "../modules/auth/Nide8Account";
import { ALICORN_ENCRYPTED_DATA_SUFFIX } from "../modules/commons/Constants";
import { getBoolean } from "../modules/config/ConfigSupport";
import { YNDialog } from "./OperatingHint";
import { ALICORN_DEFAULT_THEME_LIGHT } from "./Renderer";
import { SkinDisplay2D, SkinDisplay3D } from "./SkinDisplay";
import { useCardStyles, useInputStyles, usePadStyles } from "./Stylex";
import { tr } from "./Translator";

// This is only for Yggdrasil accounts
// MS Account and Local Account should not be saved

export function YggdrasilAccountManager(): JSX.Element {
  const classes = usePadStyles();
  const mountedBit = useRef(true);
  const accountsLoaded = useRef(false);
  const [accounts, setAccounts] = useState<Set<Account>>(new Set<Account>());
  let { adding, server } = useParams<{ adding?: string; server?: string }>();
  server = server ? decodeURIComponent(server) : undefined;
  adding = adding ? decodeURIComponent(adding) : undefined;
  const [isAdding, setAdding] = useState(String(adding) === "1");
  useEffect(() => {
    const fun = () => {
      setAdding(true);
    };
    window.addEventListener("YggdrasilAccountInfoDropped", fun);
    return () => {
      window.removeEventListener("YggdrasilAccountInfoDropped", fun);
    };
  }, []);
  useEffect(() => {
    mountedBit.current = true;
    if (!accountsLoaded.current) {
      accountsLoaded.current = true;
      void (async () => {
        const a = await getAllAccounts();
        const builtAccount: Set<Account> = new Set<Account>();
        for (const accountFile of a) {
          const r = await loadAccount(accountFile);
          if (r) {
            builtAccount.add(r);
          }
        }
        if (mountedBit.current) {
          setAccounts(builtAccount);
        }
      })();
    }
    return () => {
      mountedBit.current = false;
    };
  });

  return (
    <Box className={classes.para + " yggdrasil_droppable"}>
      <Typography className={classes.smallText} color={"secondary"}>
        {tr("AccountManager.Note")}
      </Typography>
      <Box style={{ textAlign: "right" }}>
        <Tooltip
          title={
            <Typography className={"smtxt"}>
              {tr("AccountManager.Reload")}
            </Typography>
          }
        >
          <IconButton
            color={"inherit"}
            onClick={() => {
              accountsLoaded.current = false;
              setAccounts(new Set<Account>());
            }}
          >
            <Refresh />
          </IconButton>
        </Tooltip>
        <Tooltip
          title={
            <Typography className={"smtxt"}>
              {tr("AccountManager.AddYggdrasil")}
            </Typography>
          }
        >
          <IconButton
            color={"inherit"}
            onClick={() => {
              setAdding(true);
            }}
          >
            <Add />
          </IconButton>
        </Tooltip>
      </Box>
      <AddAccountWrapper
        open={isAdding}
        server={server}
        onClose={() => {
          setAdding(false);
        }}
        handleNewAccount={(a) => {
          setAdding(false);
          const s1 = new Set(accounts.keys());
          s1.add(a);
          setAccounts(s1);
        }}
      />
      {(() => {
        const components: JSX.Element[] = [];
        for (const a of accounts) {
          components.push(
            <SingleAccountDisplay
              key={a.getAccountIdentifier()}
              account={a}
              updateAccount={(n) => {
                const aCopy = new Set(accounts.keys());
                aCopy.delete(a);
                aCopy.add(n);
                setAccounts(aCopy);
              }}
              deleteAccount={(c) => {
                const aCopy = new Set(accounts.keys());
                aCopy.delete(c);
                setAccounts(aCopy);
              }}
            />
          );
        }
        return components;
      })()}
    </Box>
  );
}

export function SingleAccountDisplay(props: {
  account: Account;
  updateAccount: (origin: Account, newAccount: Account) => unknown;
  deleteAccount: (origin: Account) => unknown;
}): JSX.Element {
  const accountCopy = copyAccount(props.account);
  const classes = useCardStyles();
  const [isOperating, setOperating] = useState(false);
  const [mjLWOpening, setMjLWOpen] = useState(false);
  const usingAccount = useRef<Account>(accountCopy);
  const [isAsking, setIsAsking] = useState(false);
  const [skinUrl, setSkinUrl] = useState("");
  useEffect(() => {
    void (async () => {
      const u = await querySkinFor(props.account);
      setSkinUrl(u);
    })();
  }, [props.account.lastUsedUUID, props.account.lastUsedAccessToken]);
  return (
    <>
      {/* Confirm delete */}
      {isAsking ? (
        <YNDialog
          onClose={() => {
            setIsAsking(false);
          }}
          onAccept={async () => {
            setIsAsking(false);
            await removeAccount(
              usingAccount.current.getAccountIdentifier() +
                ALICORN_ENCRYPTED_DATA_SUFFIX
            );
            props.deleteAccount(props.account);
          }}
          title={tr("AccountManager.DeleteTitle")}
          content={tr("AccountManager.DeleteMsg")}
          yes={tr("AccountManager.Yes")}
          no={tr("AccountManager.No")}
        />
      ) : (
        ""
      )}
      {/* This is for Mojang */}
      <YggdrasilForm
        onClose={() => {
          setMjLWOpen(false);
          setOperating(false);
        }}
        open={mjLWOpening}
        account={usingAccount.current}
        updateAccount={async (a) => {
          setMjLWOpen(false);
          await saveAccount(a);
          usingAccount.current = a;
          props.updateAccount(props.account, a);
          setOperating(false);
        }}
      />
      <Card className={classes.card} raised={true}>
        <CardContent>
          <Box style={{ float: "right" }}>
            {skinUrl ? (
              getBoolean("features.skin-view-3d") ? (
                <SkinDisplay3D skin={skinUrl} width={100} height={150} />
              ) : (
                <SkinDisplay2D skin={skinUrl} />
              )
            ) : (
              ""
            )}
            <Tooltip
              title={
                <Typography className={"smtxt"}>
                  {tr("AccountManager.Remove")}
                </Typography>
              }
            >
              <IconButton
                disabled={isOperating}
                color={"inherit"}
                className={classes.operateButton}
                onClick={() => {
                  setIsAsking(true);
                }}
              >
                <DeleteForever />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={
                <Typography className={"smtxt"}>
                  {tr("AccountManager.Refresh")}
                </Typography>
              }
            >
              <IconButton
                disabled={isOperating}
                color={"inherit"}
                className={classes.operateButton}
                onClick={() => {
                  setOperating(true);
                  void (async () => {
                    const status = await usingAccount.current.flushToken();
                    if (status) {
                      await saveAccount(usingAccount.current);
                      setOperating(false);
                    } else {
                      setMjLWOpen(true);
                    }
                    props.updateAccount(props.account, usingAccount.current);
                  })();
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            <br />
          </Box>
          <Typography
            className={classes.text}
            color={"textSecondary"}
            gutterBottom
          >
            {toReadableType(props.account.type)}
          </Typography>
          <Typography variant={"h6"} className={classes.color} gutterBottom>
            {props.account.accountName}
          </Typography>
          <Typography
            className={classes.text}
            color={"textSecondary"}
            gutterBottom
          >
            {props.account.lastUsedUUID}
          </Typography>
          {skinUrl ? (
            <Typography
              className={classes.text}
              color={"textSecondary"}
              gutterBottom
            >
              {tr(
                getBoolean("features.skin-view-3d")
                  ? "AccountManager.SkinView3D"
                  : "AccountManager.SkinView2D"
              )}
            </Typography>
          ) : (
            ""
          )}
          <LinearProgress
            color={"secondary"}
            style={isOperating ? {} : { display: "none" }}
          />
        </CardContent>
      </Card>
      <br />
    </>
  );
}

export function toReadableType(t: AccountType): string {
  switch (t) {
    case AccountType.NIDE8:
      return "Nide8";
    case AccountType.ALICORN:
      return "Alicorn";
    case AccountType.AUTHLIB_INJECTOR:
      return "Authlib Injector";
    case AccountType.MICROSOFT:
      return "Microsoft";
    case AccountType.MOJANG:
    default:
      return "Mojang";
  }
}

// Method updateAccount will only be called if success
function YggdrasilForm(props: {
  onClose: () => unknown;
  open: boolean;
  account: Account | undefined;
  updateAccount: (a: Account) => unknown;
}): JSX.Element {
  const classes = useInputStyles();
  const [pwd, setPwd] = useState("");
  const [isRunning, isRunningUpdate] = useState(false);
  const [hasError, setError] = useState(false);
  return (
    <ThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
      <Dialog
        open={props.open}
        onClose={() => {
          setError(false);
          setPwd("");
          isRunningUpdate(false);
          props.onClose();
        }}
      >
        <DialogTitle>{tr("AccountManager.EnterPassword")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {tr("AccountManager.EnterPasswordHint")}
          </DialogContentText>
          <TextField
            className={classes.input}
            autoFocus
            margin={"dense"}
            onChange={(e) => {
              setPwd(e.target.value);
            }}
            label={tr("AccountManager.Password")}
            type={"password"}
            spellCheck={false}
            color={"secondary"}
            disabled={isRunning}
            fullWidth
            variant={"outlined"}
            value={pwd}
          />
          {hasError ? (
            <DialogContentText
              style={{
                color: "#ff8400",
              }}
              className={"smtxt"}
            >
              {tr("AccountManager.Failed")}
            </DialogContentText>
          ) : (
            ""
          )}
        </DialogContent>
        <DialogActions>
          <Button
            disabled={pwd.length === 0 || isRunning}
            onClick={() => {
              isRunningUpdate(true);
              void (async () => {
                setError(false);
                const acc = copyAccount(props.account);
                if (await acc.performAuth(pwd)) {
                  props.updateAccount(acc);
                } else {
                  setError(true);
                }
                isRunningUpdate(false);
                setPwd("");
              })();
            }}
          >
            {tr("AccountManager.Validate")}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

// Add Yggdrasil
// Need to be closed manually when handleNewAccount is called
function AddAccount(props: {
  open: boolean;
  onClose: () => unknown;
  handleNewAccount: (a: Account) => unknown;
  server?: string;
}): JSX.Element {
  const [email, setEmail] = useState("");
  const [authHost, setAuthHost] = useState<string>(
    decodeURIComponent(props.server || "")
  );
  const [isCustom, setIsCustom] = useState(
    props.server !== undefined && props.server.length > 0
  );
  const [isNide, setNide] = useState(false);
  const classes = useInputStyles();
  useEffect(() => {
    const fun = (e: Event) => {
      const ev = e as CustomEvent;
      setIsCustom(true);
      setAuthHost(ev.detail);
    };
    window.addEventListener("YggdrasilAccountInfoDropped", fun);
    return () => {
      window.removeEventListener("YggdrasilAccountInfoDropped", fun);
    };
  }, []);
  return (
    <Box
      onDrop={(e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("text/plain");
        setIsCustom(true);
        setAuthHost(
          decodeURIComponent(
            data.toString().split("authlib-injector:yggdrasil-server:")[1]
          )
        );
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
    >
      <ThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
        <Dialog
          open={props.open}
          onClose={() => {
            props.onClose();
            setEmail("");
          }}
        >
          <DialogContent>
            <DialogTitle>{tr("AccountManager.AddTitle")}</DialogTitle>
            <TextField
              autoFocus
              className={classes.input}
              margin={"dense"}
              color={"secondary"}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              label={tr("AccountManager.Email")}
              type={"email"}
              spellCheck={false}
              fullWidth
              variant={"outlined"}
              value={email}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isCustom}
                  onChange={(e) => {
                    setIsCustom(e.target.checked);
                    if (!e.target.checked) {
                      setNide(false);
                    }
                  }}
                />
              }
              label={tr("AccountManager.UseCustomHost")}
            />
            <FormControlLabel
              control={
                <Switch
                  disabled={!isCustom}
                  checked={isCustom && isNide}
                  onChange={(e) => {
                    setNide(e.target.checked);
                  }}
                />
              }
              label={tr("AccountManager.UseNide8")}
            />
            <TextField
              disabled={!isCustom}
              className={classes.input}
              margin={"dense"}
              color={"secondary"}
              onChange={(e) => {
                setAuthHost(e.target.value);
              }}
              label={tr("AccountManager.Host")}
              spellCheck={false}
              value={authHost}
              fullWidth
              variant={"outlined"}
            />
            {isCustom ? (
              <DialogContentText
                style={{
                  color: "#ff8400",
                }}
                className={"smtxt"}
              >
                {tr("AccountManager.Warn")}
              </DialogContentText>
            ) : (
              ""
            )}
          </DialogContent>
          <DialogActions>
            <Button
              disabled={
                email.length === 0 || (isCustom && authHost.trim().length === 0)
              }
              onClick={() => {
                if (isCustom) {
                  if (isNide) {
                    props.handleNewAccount(new Nide8Account(email, authHost));
                  } else {
                    props.handleNewAccount(
                      new AuthlibAccount(
                        email,
                        authHost.endsWith("/")
                          ? authHost.slice(0, -1)
                          : authHost
                      )
                    );
                  }
                } else {
                  props.handleNewAccount(new MojangAccount(email));
                }
              }}
            >
              {tr("AccountManager.Next")}
            </Button>
          </DialogActions>
        </Dialog>
      </ThemeProvider>
    </Box>
  );
}

function AddAccountWrapper(props: {
  open: boolean;
  onClose: () => unknown;
  handleNewAccount: (a: Account) => unknown;
  server?: string;
}): JSX.Element {
  const [isPwdOpen, isPwdOpenUpdate] = useState(false);
  const [isEmailOpen, isEmailOpenUpdate] = useState(true);
  const [tmpAccount, tmpAccountUpdate] = useState<Account>();
  return (
    <>
      <YggdrasilForm
        onClose={() => {
          isPwdOpenUpdate(false);
          isEmailOpenUpdate(true);
        }}
        open={props.open && isPwdOpen}
        account={tmpAccount}
        updateAccount={async (a) => {
          tmpAccountUpdate(a);
          await saveAccount(a);
          isPwdOpenUpdate(false);
          props.onClose();
          isEmailOpenUpdate(true);
          props.handleNewAccount(a);
        }}
      />
      <AddAccount
        server={props.server}
        open={props.open && isEmailOpen}
        onClose={() => {
          isEmailOpenUpdate(true);
          isPwdOpenUpdate(false);
          props.onClose();
        }}
        handleNewAccount={(a) => {
          isEmailOpenUpdate(false);
          isPwdOpenUpdate(true);
          tmpAccountUpdate(a);
        }}
      />
    </>
  );
}
